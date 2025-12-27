from database import engine
from sqlalchemy import text

# Change strava_activity_id from INTEGER to BIGINT to support large Strava activity IDs
with engine.connect() as conn:
    try:
        conn.execute(
            text("ALTER TABLE activities ALTER COLUMN strava_activity_id TYPE BIGINT;")
        )
        conn.commit()
        print("strava_activity_id column changed to BIGINT successfully")
    except Exception as e:
        print(f"Error: {e}")