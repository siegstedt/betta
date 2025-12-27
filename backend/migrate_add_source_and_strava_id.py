from database import engine
from sqlalchemy import text

# Add source and strava_activity_id columns to activities table
with engine.connect() as conn:
    try:
        conn.execute(
            text("ALTER TABLE activities ADD COLUMN source VARCHAR DEFAULT 'manual';")
        )
        conn.execute(
            text("ALTER TABLE activities ADD COLUMN strava_activity_id INTEGER;")
        )
        conn.commit()
        print("Columns added successfully")
    except Exception as e:
        print(f"Error: {e}")