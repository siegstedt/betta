from sqlalchemy.orm import Session, joinedload

import models
import schemas


def create_athlete(db: Session, athlete: schemas.AthleteCreate):
    db_athlete = models.Athlete(**athlete.model_dump())
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


def get_athletes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Athlete).offset(skip).limit(limit).all()


def get_athlete(db: Session, athlete_id: int):
    return (
        db.query(models.Athlete)
        .options(
            joinedload(models.Athlete.metrics), joinedload(models.Athlete.activities)
        )
        .filter(models.Athlete.athlete_id == athlete_id)
        .first()
    )


def update_athlete(db: Session, athlete_id: int, athlete_data: schemas.AthleteUpdate):
    db_athlete = (
        db.query(models.Athlete).filter(models.Athlete.athlete_id == athlete_id).first()
    )
    if not db_athlete:
        return None

    update_data = athlete_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_athlete, key, value)

    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


def update_athlete_profile_picture(db: Session, athlete_id: int, picture_url: str):
    db_athlete = (
        db.query(models.Athlete).filter(models.Athlete.athlete_id == athlete_id).first()
    )
    if not db_athlete:
        return None

    db_athlete.profile_picture_url = picture_url
    db.add(db_athlete)
    db.commit()
    db.refresh(db_athlete)
    return db_athlete


def delete_athlete(db: Session, athlete_id: int) -> bool:
    """Delete an athlete and all related data. Returns True if deleted, False if not found."""
    db_athlete = (
        db.query(models.Athlete).filter(models.Athlete.athlete_id == athlete_id).first()
    )
    if not db_athlete:
        return False

    db.delete(db_athlete)
    db.commit()
    return True
