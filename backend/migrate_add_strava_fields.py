from database import engine
from sqlalchemy import text

# Add Strava integration columns to athletes table
with engine.connect() as conn:
    try:
        conn.execute(
            text("ALTER TABLE athletes ADD COLUMN strava_access_token VARCHAR;")
        )
        conn.execute(
            text("ALTER TABLE athletes ADD COLUMN strava_refresh_token VARCHAR;")
        )
        conn.execute(
            text("ALTER TABLE athletes ADD COLUMN strava_expires_at TIMESTAMP;")
        )
        conn.commit()
        print("Strava columns added successfully")
    except Exception as e:
        print(f"Error: {e}")