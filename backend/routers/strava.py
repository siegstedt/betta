from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import os
import requests
from datetime import datetime
from rq import Queue
from redis import Redis

import crud
from database import get_db
from services.strava_service import StravaService

router = APIRouter(
    tags=["Strava"],
)

STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv(
    "STRAVA_REDIRECT_URI", "http://localhost:3000/athlete/1/settings"
)
VERIFY_TOKEN = os.getenv("STRAVA_VERIFY_TOKEN", "betta_verify")

# RQ Queue
redis_conn = Redis(host="redis", port=6379, db=0)
queue = Queue(connection=redis_conn)


def ensure_webhook_subscription():
    """Ensure a webhook subscription exists for the app."""
    if not STRAVA_CLIENT_ID or not STRAVA_CLIENT_SECRET:
        return

    # Check existing subscription
    response = requests.get(
        "https://www.strava.com/api/v3/push_subscriptions",
        params={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
        },
    )
    if response.status_code == 200:
        subscriptions = response.json()
        if subscriptions:
            # Already have subscription
            return

    # Create new subscription
    callback_url = os.getenv(
        "STRAVA_WEBHOOK_CALLBACK_URL", "http://localhost:8000/strava/webhook"
    )
    response = requests.post(
        "https://www.strava.com/api/v3/push_subscriptions",
        data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "callback_url": callback_url,
            "verify_token": VERIFY_TOKEN,
        },
    )
    if response.status_code == 201:
        print("Webhook subscription created")
    else:
        print(f"Failed to create webhook subscription: {response.text}")


@router.get("/strava/auth")
def strava_auth():
    """Redirect to Strava OAuth."""
    if not STRAVA_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Strava client ID not configured")
    url = f"https://www.strava.com/oauth/authorize?client_id={STRAVA_CLIENT_ID}&response_type=code&redirect_uri={STRAVA_REDIRECT_URI}&scope=activity:read_all"
    return {"auth_url": url}


@router.post("/strava/callback")
def strava_callback(data: dict, db: Session = Depends(get_db)):
    """Handle OAuth callback."""
    code = data.get("code")
    athlete_id = data.get("athlete_id")
    if not code or not athlete_id:
        raise HTTPException(status_code=400, detail="Missing code or athlete_id")

    if not STRAVA_CLIENT_ID or not STRAVA_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Strava credentials not configured")

    response = requests.post(
        "https://www.strava.com/oauth/token",
        data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        },
    )

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code")

    token_data = response.json()
    expires_at = datetime.fromtimestamp(token_data["expires_at"])
    strava_athlete_id = token_data["athlete"]["id"]

    crud.update_athlete_strava_tokens(
        db,
        athlete_id,
        token_data["access_token"],
        token_data["refresh_token"],
        expires_at,
        strava_athlete_id,
    )

    # Ensure webhook subscription exists
    ensure_webhook_subscription()

    return {"message": "Strava connected"}


# Removed manual subscribe endpoint; subscription is automated on connect


@router.get("/strava/webhook")
def verify_webhook(request: Request):
    """Verify Strava webhook."""
    hub_mode = request.query_params.get("hub.mode")
    hub_challenge = request.query_params.get("hub.challenge")
    hub_verify_token = request.query_params.get("hub.verify_token")
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return {"hub.challenge": hub_challenge}
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/strava/webhook")
async def strava_webhook(request: Request):
    """Handle Strava webhook."""
    data = await request.json()
    if data.get("aspect_type") == "create" and data.get("object_type") == "activity":
        athlete_id = data.get("owner_id")
        strava_activity_id = data.get("object_id")
        # Enqueue async job
        queue.enqueue("tasks.process_strava_activity", strava_activity_id, athlete_id)
    return {"message": "Event received"}


@router.get("/strava/activities/{athlete_id}")
def get_strava_activities(
    athlete_id: int,
    page: int = 1,
    per_page: int = 30,
    db: Session = Depends(get_db)
):
    """Fetch paginated list of Strava activities for an athlete."""
    athlete = crud.get_athlete(db, athlete_id)
    if not athlete or not athlete.strava_access_token:
        raise HTTPException(status_code=400, detail="Strava not connected")

    # Check if token is expired
    now = datetime.utcnow()
    if athlete.strava_expires_at and athlete.strava_expires_at <= now:
        # Refresh token
        service = StravaService("")  # No access token needed for refresh
        refresh_data = service.refresh_access_token(athlete.strava_refresh_token)
        expires_at = datetime.fromtimestamp(refresh_data["expires_at"])
        crud.update_athlete_strava_tokens(
            db,
            athlete.athlete_id,
            refresh_data["access_token"],
            refresh_data["refresh_token"],
            expires_at,
        )
        athlete = crud.get_athlete(db, athlete_id)

    service = StravaService(athlete.strava_access_token)
    try:
        activities = service.get_athlete_activities(page=page, per_page=per_page)
        return {"activities": activities, "page": page, "per_page": per_page}
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 429:
            raise HTTPException(status_code=429, detail="Strava API rate limit exceeded")
        raise HTTPException(status_code=500, detail="Failed to fetch Strava activities")


@router.post("/strava/ingest-selected/{athlete_id}")
def ingest_selected_strava_activities(
    athlete_id: int,
    selected_ids: list[int],
    db: Session = Depends(get_db)
):
    """Ingest selected Strava activities."""
    athlete = crud.get_athlete(db, athlete_id)
    if not athlete or not athlete.strava_access_token:
        raise HTTPException(status_code=400, detail="Strava not connected")

    # Check if token is expired
    now = datetime.utcnow()
    if athlete.strava_expires_at and athlete.strava_expires_at <= now:
        # Refresh token
        service = StravaService("")  # No access token needed for refresh
        refresh_data = service.refresh_access_token(athlete.strava_refresh_token)
        expires_at = datetime.fromtimestamp(refresh_data["expires_at"])
        crud.update_athlete_strava_tokens(
            db,
            athlete.athlete_id,
            refresh_data["access_token"],
            refresh_data["refresh_token"],
            expires_at,
        )
        athlete = crud.get_athlete(db, athlete_id)

    # Enqueue jobs for selected activities
    for strava_activity_id in selected_ids:
        # Check if already exists
        existing = crud.get_activity_by_strava_id(db, strava_activity_id)
        if not existing:
            queue.enqueue("tasks.process_strava_activity", strava_activity_id, athlete.strava_athlete_id)

    return {"message": f"Enqueued {len(selected_ids)} activities for ingestion"}


@router.delete("/strava/disconnect/{athlete_id}")
def disconnect_strava(athlete_id: int, db: Session = Depends(get_db)):
    """Disconnect Strava."""
    crud.disconnect_strava(db, athlete_id)
    return {"message": "Disconnected"}
