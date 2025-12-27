from database import engine
from sqlalchemy import text

# Add strava_athlete_id column to athletes table
with engine.connect() as conn:
    try:
        conn.execute(
            text("ALTER TABLE athletes ADD COLUMN strava_athlete_id INTEGER UNIQUE;")
        )
        conn.commit()
        print("Column added successfully")
    except Exception as e:
        print(f"Error: {e}")