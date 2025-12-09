from database import engine
from sqlalchemy import text

# Add profile_picture_url column to athletes table
with engine.connect() as conn:
    try:
        conn.execute(
            text("ALTER TABLE athletes ADD COLUMN profile_picture_url VARCHAR;")
        )
        conn.commit()
        print("Column added successfully")
    except Exception as e:
        print(f"Error: {e}")
