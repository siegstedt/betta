from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import os
import requests
from datetime import datetime

import crud
from database import get_db

router = APIRouter(
    tags=["Strava"],
)

STRAVA_CLIENT_ID = os.getenv("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.getenv("STRAVA_CLIENT_SECRET")
STRAVA_REDIRECT_URI = os.getenv(
    "STRAVA_REDIRECT_URI", "http://localhost:3000/athlete/1/settings"
)
VERIFY_TOKEN = os.getenv("STRAVA_VERIFY_TOKEN", "betta_verify")


@router.get("/strava/auth")
def strava_auth():
    """Redirect to Strava OAuth."""
    if not STRAVA_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Strava client ID not configured")
    url = f"https://www.strava.com/oauth/authorize?client_id={STRAVA_CLIENT_ID}&response_type=code&redirect_uri={STRAVA_REDIRECT_URI}&scope=activity:read"
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

    crud.update_athlete_strava_tokens(
        db,
        athlete_id,
        token_data["access_token"],
        token_data["refresh_token"],
        expires_at,
    )
    return {"message": "Strava connected"}


@router.post("/strava/webhook/subscribe")
def subscribe_webhook(callback_url: str, db: Session = Depends(get_db)):
    """Subscribe to Strava webhooks."""
    if not STRAVA_CLIENT_ID or not STRAVA_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Strava credentials not configured")

    response = requests.post(
        "https://www.strava.com/api/v3/push_subscriptions",
        data={
            "client_id": STRAVA_CLIENT_ID,
            "client_secret": STRAVA_CLIENT_SECRET,
            "callback_url": callback_url,
            "verify_token": VERIFY_TOKEN,
        },
    )

    if response.status_code != 201:
        raise HTTPException(status_code=400, detail=f"Failed to subscribe: {response.text}")

    return {"message": "Webhook subscribed", "subscription": response.json()}


@router.get("/strava/webhook")
def verify_webhook(hub_mode: str, hub_challenge: str, hub_verify_token: str):
    """Verify Strava webhook."""
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return {"hub.challenge": hub_challenge}
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/strava/webhook")
async def strava_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Strava webhook."""
    data = await request.json()
    if data.get("aspect_type") == "create" and data.get("object_type") == "activity":
        athlete_id = data.get("owner_id")
        strava_activity_id = data.get("object_id")
        athlete = crud.get_athlete(db, athlete_id)
        if athlete and athlete.strava_access_token:
            from services.strava_service import StravaService

            # Check if token is expired
            now = datetime.utcnow()
            if athlete.strava_expires_at and athlete.strava_expires_at <= now:
                # Refresh token
                service = StravaService("")  # No access token needed for refresh
                refresh_data = service.refresh_access_token(athlete.strava_refresh_token)
                expires_at = datetime.fromtimestamp(refresh_data["expires_at"])
                crud.update_athlete_strava_tokens(
                    db,
                    athlete_id,
                    refresh_data["access_token"],
                    refresh_data["refresh_token"],
                    expires_at,
                )
                # Refresh athlete object
                athlete = crud.get_athlete(db, athlete_id)

            service = StravaService(athlete.strava_access_token)
            summary = service.get_activity_summary(strava_activity_id)
            streams = service.get_activity_streams(strava_activity_id)
            activity = service.map_to_betta_activity(
                {"summary": summary, "streams": streams}, athlete_id, db
            )
            db.add(activity)
            db.commit()
            return {"message": "Activity ingested"}
    return {"message": "Ignored"}


@router.delete("/strava/disconnect/{athlete_id}")
def disconnect_strava(athlete_id: int, db: Session = Depends(get_db)):
    """Disconnect Strava."""
    crud.disconnect_strava(db, athlete_id)
    return {"message": "Disconnected"}
