import os
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func

import models
import schemas
import services

def create_activity_with_records(
    db: Session, 
    activity: schemas.ActivityBase, 
    records: list[dict], 
    laps: list[dict], 
    potential_markers: list[schemas.PotentialPerformanceMarkerCreate],
    athlete_id: int, 
    fit_file_path: str
):
    """
    Creates an Activity and bulk-inserts its associated records for efficiency.
    """
    # 1. Create the Activity object to get its ID
    db_activity = models.Activity(**activity.model_dump(), athlete_id=athlete_id, fit_file_path=fit_file_path)

    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    # 2. Add the new activity_id to each record dictionary
    if records:
        for record in records:
            record['activity_id'] = db_activity.activity_id
        
        # 3. Perform a bulk insert of all records
        db.bulk_insert_mappings(models.ActivityRecord, records)
        db.commit()

    # 4. Add the new activity_id to each lap dictionary
    if laps:
        for lap in laps:
            lap['activity_id'] = db_activity.activity_id
        
        # 5. Perform a bulk insert of all laps
        db.bulk_insert_mappings(models.ActivityLap, laps)
        db.commit()

    # 6. Create Potential Markers now that we have a valid activity_id
    if potential_markers:
        for marker_data in potential_markers:
            db_marker = models.PotentialPerformanceMarker(
                **marker_data.model_dump(),
                athlete_id=athlete_id,
                activity_id=db_activity.activity_id
            )
            db.add(db_marker)
        db.commit()

    return db_activity

def create_manual_activity(
    db: Session,
    activity_data: schemas.ActivityCreateManual,
    athlete_id: int
):
    """
    Creates a new activity from manually entered data.
    """
    # Convert duration from seconds to total_moving_time and total_elapsed_time
    total_moving_time = activity_data.duration
    total_elapsed_time = activity_data.duration

    # Create the Activity object
    db_activity = models.Activity(
        **activity_data.model_dump(exclude_unset=True),
        athlete_id=athlete_id,
        total_moving_time=total_moving_time,
        total_elapsed_time=total_elapsed_time,
        total_distance=activity_data.distance,
        average_speed=activity_data.average_speed,
        average_cadence=activity_data.average_cadence,
        average_heart_rate=activity_data.average_heart_rate,
        average_power=activity_data.average_power,
        # Set max values to average values for manual entry if not provided
        max_speed=activity_data.average_speed,
        max_cadence=activity_data.average_cadence,
        max_heart_rate=activity_data.average_heart_rate,
        max_power=activity_data.average_power,
    )

    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    # Create a single record for manual activities to represent the summary
    # This ensures consistency with activities uploaded via .fit files which always have records
    record_data = {
        "timestamp": activity_data.start_time,
        "power": activity_data.average_power,
        "heart_rate": activity_data.average_heart_rate,
        "cadence": activity_data.average_cadence,
        "speed": activity_data.average_speed,
        "activity_id": db_activity.activity_id
    }
    db_record = models.ActivityRecord(**record_data)
    db.add(db_record)
    db.commit()

    return db_activity


def get_activity(db: Session, activity_id: int):
    # Use joinedload to efficiently fetch the activity and all its records in one query
    return (
        db.query(models.Activity)
        .options(
            joinedload(models.Activity.records),
            joinedload(models.Activity.laps),
            joinedload(models.Activity.bike),
            joinedload(models.Activity.shoe),
            joinedload(models.Activity.device),
            joinedload(models.Activity.trainer)
        )
        .filter(models.Activity.activity_id == activity_id)
        .first()
    )


def get_activities_by_athlete(
    db: Session,
    athlete_id: int,
    skip: int = 0,
    limit: int = 100,
    sport: str = None,
    sub_sport: str = None,
    ride_type: str = None,
    start_date: str = None,
    end_date: str = None
):
    query = db.query(models.Activity).filter(models.Activity.athlete_id == athlete_id)

    if sport:
        query = query.filter(models.Activity.sport == sport)
    if sub_sport:
        query = query.filter(models.Activity.sub_sport == sub_sport)
    if ride_type:
        query = query.filter(models.Activity.ride_type == ride_type)
    if start_date:
        query = query.filter(func.date(models.Activity.start_time) >= start_date)
    if end_date:
        query = query.filter(func.date(models.Activity.start_time) <= end_date)

    total_count = query.count()

    activities = query.order_by(desc(models.Activity.start_time)).offset(skip).limit(limit).all()

    return activities, total_count


def update_activity(db: Session, activity_id: int, activity_data: schemas.ActivityUpdate):
    db_activity = get_activity(db, activity_id=activity_id)
    if not db_activity:
        return None

    update_data = activity_data.model_dump(exclude_unset=True)

    # Apply updates to the model first
    for key, value in update_data.items():
        setattr(db_activity, key, value)

    # If a trainer setting is provided, trigger virtual power calculation
    if 'trainer_setting' in update_data and update_data['trainer_setting'] is not None:
        services.activity_processing.recalculate_virtual_power(
            db=db,
            activity=db_activity,
            trainer_setting=update_data['trainer_setting']
        )

    # If RPE was updated, recalculate PSS
    if 'perceived_exertion' in update_data and db_activity.perceived_exertion is not None:
        pss = services.calculations.calculate_pss(
            rpe=db_activity.perceived_exertion,
            duration_seconds=db_activity.total_moving_time
        )
        db_activity.perceived_strain_score = pss

    # Now, recalculate unified training load based on the updated activity state
    athlete = db_activity.athlete
    if db_activity.tss and db_activity.tss > 0:
        db_activity.unified_training_load = db_activity.tss
    elif db_activity.trimp and db_activity.trimp > 0:
        db_activity.unified_training_load = int(round(db_activity.trimp * athlete.psf_trimp))
    elif db_activity.perceived_strain_score and db_activity.perceived_strain_score > 0:
        db_activity.unified_training_load = int(round(db_activity.perceived_strain_score * athlete.psf_pss))
    else:
        db_activity.unified_training_load = 0
                
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity


def delete_activity(db: Session, activity_id: int):
    db_activity = db.query(models.Activity).filter(models.Activity.activity_id == activity_id).first()
    if not db_activity:
        return None

    # Delete the associated .fit file if it exists
    if db_activity.fit_file_path and os.path.exists(db_activity.fit_file_path):
        os.remove(db_activity.fit_file_path)

    db.delete(db_activity)
    db.commit()
    return {"ok": True}
