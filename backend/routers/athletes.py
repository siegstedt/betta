from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
from pathlib import Path

import crud
import schemas
from database import get_db

router = APIRouter(
    tags=["Athletes"],
)


@router.post("/athlete", response_model=schemas.AthleteResponse, status_code=201)
def create_athlete(athlete: schemas.AthleteCreate, db: Session = Depends(get_db)):
    """Creates a new athlete."""
    return crud.create_athlete(db=db, athlete=athlete)


@router.get("/athlete/{athlete_id}", response_model=schemas.AthleteResponse)
def read_athlete(athlete_id: int, db: Session = Depends(get_db)):
    """Retrieves a single athlete by their ID, including their metrics and activities."""
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return db_athlete


@router.get("/athletes", response_model=List[schemas.AthleteResponse])
def read_athletes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieves a list of all athletes."""
    athletes = crud.get_athletes(db, skip=skip, limit=limit)
    return athletes


@router.put("/athlete/{athlete_id}", response_model=schemas.AthleteResponse)
def update_athlete_info(
    athlete_id: int, athlete: schemas.AthleteUpdate, db: Session = Depends(get_db)
):
    """Updates an athlete's profile information."""
    updated_athlete = crud.update_athlete(
        db=db, athlete_id=athlete_id, athlete_data=athlete
    )
    if updated_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return updated_athlete


@router.post(
    "/athlete/{athlete_id}/profile-picture", response_model=schemas.AthleteResponse
)
async def upload_profile_picture(
    athlete_id: int,
    profile_picture: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Uploads a profile picture for the athlete."""
    # Check if athlete exists
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Validate file type
    if not profile_picture.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Validate file size (5MB limit)
    file_size = 0
    content = await profile_picture.read()
    file_size = len(content)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")

    # Create uploads directory if it doesn't exist
    upload_dir = Path("static/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_extension = os.path.splitext(profile_picture.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Update athlete profile picture URL
    picture_url = f"/static/uploads/{unique_filename}"
    updated_athlete = crud.update_athlete_profile_picture(db, athlete_id, picture_url)
    if updated_athlete is None:
        raise HTTPException(status_code=500, detail="Failed to update profile picture")

    return updated_athlete


@router.delete("/athlete/{athlete_id}")
def delete_athlete(athlete_id: int, db: Session = Depends(get_db)):
    """Deletes an athlete and all associated data."""
    deleted = crud.delete_athlete(db, athlete_id=athlete_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return {"message": "Athlete deleted successfully"}
