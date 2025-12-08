import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# We read the database URL from the environment variables, which is set in docker-compose.yml
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get a DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

