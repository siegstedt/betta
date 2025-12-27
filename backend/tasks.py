from database import SessionLocal
from services.strava_service import StravaService
import crud
from datetime import datetime
import requests


def process_strava_activity(strava_activity_id, strava_athlete_id):
    """Process a Strava activity asynchronously."""
    db = SessionLocal()
    try:
        athlete = crud.get_athlete_by_strava_id(db, strava_athlete_id)
        if not athlete or not athlete.strava_access_token:
            print(f"No athlete or token for strava_id {strava_athlete_id}")
            return

        # Idempotency check: skip if activity already exists
        existing_activity = crud.get_activity_by_strava_id(db, strava_activity_id)
        if existing_activity:
            print(f"Activity {strava_activity_id} already exists, skipping")
            return

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
            athlete = crud.get_athlete_by_strava_id(db, strava_athlete_id)

        service = StravaService(athlete.strava_access_token)
        summary = service.get_activity_summary(strava_activity_id)
        try:
            streams = service.get_activity_streams(strava_activity_id)
            print(f"Fetched streams for activity {strava_activity_id}: {list(streams.keys())}")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                print(f"Streams not available for activity {strava_activity_id}, proceeding with summary only")
                streams = {}
            else:
                raise
        activity = service.map_to_betta_activity(
            {"summary": summary, "streams": streams}, athlete.athlete_id, db
        )
        print(f"Created {len(activity.records)} records and {len(activity.laps)} laps for activity {strava_activity_id}. TSS: {activity.tss or 0}")
        db.add(activity)
        db.commit()
        print(f"Activity {strava_activity_id} ingested for athlete {athlete.athlete_id}")
    except Exception as e:
        print(f"Error processing activity {strava_activity_id}: {e}")
        db.rollback()
    finally:
        db.close()
