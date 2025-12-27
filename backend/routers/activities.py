import os
import uuid
import fitparse
import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from typing import List, Optional, Tuple

import crud
import schemas
import services
import models
from services.strava_service import StravaService
from database import get_db
from datetime import datetime, timedelta

router = APIRouter(
    tags=["Activities"],
)


@router.get("/activities/recent", response_model=List[schemas.RecentActivityResponse])
def read_recent_activities(limit: int = 20, db: Session = Depends(get_db)):
    """Returns a list of recent activities from all athletes."""
    activities = crud.get_recent_activities(db, limit=limit)
    # Convert to response format
    result = []
    for activity in activities:
        # Create response with activity data and athlete info
        response = schemas.RecentActivityResponse(
            activity_id=activity.activity_id,
            name=activity.name,
            sport=activity.sport,
            sub_sport=activity.sub_sport,
            ride_type=activity.ride_type,
            bike_id=activity.bike_id,
            shoe_id=activity.shoe_id,
            device_id=activity.device_id,
            trainer_id=activity.trainer_id,
            description=activity.description,
            start_time=activity.start_time,
            total_moving_time=activity.total_moving_time,
            total_elapsed_time=activity.total_elapsed_time,
            total_distance=activity.total_distance,
            total_elevation_gain=activity.total_elevation_gain,
            average_speed=activity.average_speed,
            max_speed=activity.max_speed,
            average_cadence=activity.average_cadence,
            max_cadence=activity.max_cadence,
            average_heart_rate=activity.average_heart_rate,
            max_heart_rate=activity.max_heart_rate,
            average_power=activity.average_power,
            max_power=activity.max_power,
            normalized_power=activity.normalized_power,
            total_calories=activity.total_calories,
            perceived_exertion=activity.perceived_exertion,
            perceived_strain_score=activity.perceived_strain_score,
            trimp=activity.trimp,
            intensity_factor=activity.intensity_factor,
            unified_training_load=activity.unified_training_load,
            tss=activity.tss,
            athlete_id=activity.athlete.athlete_id,
            athlete_first_name=activity.athlete.first_name,
            athlete_last_name=activity.athlete.last_name,
        )
        result.append(response)
    return result


@router.get(
    "/athlete/{athlete_id}/activities",
    response_model=Tuple[List[schemas.ActivitySummary], int],
)
def read_athlete_activities(
    athlete_id: int,
    skip: int = 0,
    limit: int = 100,
    sport: Optional[str] = None,
    sub_sport: Optional[str] = None,
    ride_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Returns a list of all activities (summary view) for a given athlete."""
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    activities, total_count = crud.get_activities_by_athlete(
        db,
        athlete_id=athlete_id,
        skip=skip,
        limit=limit,
        sport=sport,
        sub_sport=sub_sport,
        ride_type=ride_type,
        start_date=start_date,
        end_date=end_date,
    )

    return activities, total_count


@router.get(
    "/athlete/{athlete_id}/visual-activity-log",
    response_model=schemas.VisualActivityLogResponse,
)
def read_visual_activity_log(
    athlete_id: int,
    metric: str = "moving_time",  # moving_time, distance, unified_training_load
    sport: Optional[str] = None,
    sub_sport: Optional[str] = None,
    ride_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Returns activities grouped by weeks for visual bubble chart display."""
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    # Validate metric parameter
    valid_metrics = ["moving_time", "distance", "unified_training_load"]
    if metric not in valid_metrics:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric. Must be one of: {', '.join(valid_metrics)}",
        )

    # Get activities with filters
    activities, _ = crud.get_activities_by_athlete(
        db,
        athlete_id=athlete_id,
        skip=0,
        limit=10000,  # Get all activities for the period
        sport=sport,
        sub_sport=sub_sport,
        ride_type=ride_type,
        start_date=start_date,
        end_date=end_date,
    )

    # Process into weekly visual data
    weekly_data = services.activity_processing.process_visual_activity_log(
        activities, metric
    )

    return schemas.VisualActivityLogResponse(weeks=weekly_data)


@router.get("/activity/{activity_id}", response_model=schemas.Activity)
def read_activity(activity_id: int, db: Session = Depends(get_db)):
    """Returns all details for a single activity, including its time-series records."""
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity


@router.put("/activity/{activity_id}", response_model=schemas.Activity)
def update_activity_details(
    activity_id: int,
    activity_data: schemas.ActivityUpdate,
    db: Session = Depends(get_db),
):
    """Updates descriptive details of an activity."""
    updated_activity = crud.update_activity(
        db=db, activity_id=activity_id, activity_data=activity_data
    )
    if updated_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    # After updating activity, update scaling factors and PMC
    services.athlete_services.update_scaling_factors(db, updated_activity.athlete_id)
    services.calculations.recalculate_pmc_from_date(
        db, updated_activity.athlete_id, updated_activity.start_time.date()
    )

    return updated_activity


@router.delete("/activity/{activity_id}", status_code=204)
def delete_activity_endpoint(activity_id: int, db: Session = Depends(get_db)):
    """Deletes an activity and triggers a PMC recalculation."""
    activity_to_delete = crud.get_activity(db, activity_id)
    if not activity_to_delete:
        raise HTTPException(status_code=404, detail="Activity not found")

    athlete_id = activity_to_delete.athlete_id
    activity_date = activity_to_delete.start_time.date()

    # This commits the deletion
    crud.delete_activity(db, activity_id=activity_id)

    # Now, trigger a recalculation starting from the date of the deleted activity
    services.calculations.recalculate_pmc_from_date(db, athlete_id, activity_date)
    return Response(status_code=204)


@router.get("/activity/{activity_id}/download", tags=["Activities"])
def download_activity_file(activity_id: int, db: Session = Depends(get_db)):
    """Downloads the original .fit file for an activity."""
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if not db_activity or not db_activity.fit_file_path:
        raise HTTPException(
            status_code=404, detail="FIT file not found for this activity."
        )

    if not os.path.exists(db_activity.fit_file_path):
        raise HTTPException(status_code=404, detail="File not found on server.")

    file_name = f"betta_activity_{activity_id}.fit"
    return FileResponse(
        path=db_activity.fit_file_path,
        media_type="application/vnd.ant.fit",
        filename=file_name,
    )


@router.get(
    "/activity/{activity_id}/zone-analysis", response_model=schemas.ZoneAnalysis
)
def get_zone_analysis(activity_id: int, db: Session = Depends(get_db)):
    """Calculates and returns the time spent in power and heart rate zones."""
    activity = crud.get_activity(db, activity_id=activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    power_data = [r.power for r in activity.records if r.power is not None]
    hr_data = [r.heart_rate for r in activity.records if r.heart_rate is not None]

    # Get athlete's thresholds at the time of the activity
    ftp_record = crud.get_latest_ftp(
        db, athlete_id=activity.athlete_id, activity_date=activity.start_time
    )
    lthr_record = crud.get_latest_lthr(
        db, athlete_id=activity.athlete_id, activity_date=activity.start_time
    )

    ftp = ftp_record[0] if ftp_record else None
    lthr = lthr_record[0] if lthr_record else None

    power_zones = None
    if ftp and power_data:
        power_zones = services.calculations.calculate_time_in_zones(
            power_data, ftp, services.calculations.POWER_ZONE_DEFINITIONS
        )

    hr_zones = None
    if lthr and hr_data:
        hr_zones = services.calculations.calculate_time_in_zones(
            hr_data, lthr, services.calculations.HR_ZONE_DEFINITIONS
        )

    return schemas.ZoneAnalysis(
        power_zones=power_zones, hr_zones=hr_zones, ftp=ftp, lthr=lthr
    )


@router.post("/activity/upload/{athlete_id}", response_model=schemas.Activity)
async def upload_activity(
    athlete_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """
    Uploads a .fit file, parses it, performs calculations, and saves it to the database.
    """
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    if not file.filename.lower().endswith(".fit"):
        raise HTTPException(
            status_code=400, detail="Invalid file type. Please upload a .fit file."
        )

    content = await file.read()

    fit_files_dir = "/app/fit_files"
    os.makedirs(fit_files_dir, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.fit"
    file_path = os.path.join(fit_files_dir, unique_filename)
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    activity_data, record_dicts, lap_dicts, potential_markers = (
        services.fit_parser.parse_fit_file(
            content=content,
            db=db,
            athlete_id=athlete_id,
            file_name=file.filename,
        )
    )

    new_activity = crud.create_activity_with_records(
        db=db,
        activity=activity_data,
        records=record_dicts,
        laps=lap_dicts,
        potential_markers=potential_markers,
        athlete_id=athlete_id,
        fit_file_path=file_path,
    )

    # After creating activity, update scaling factors and PMC
    services.athlete_services.update_scaling_factors(db, athlete_id)
    services.calculations.recalculate_pmc_from_date(
        db, athlete_id, new_activity.start_time.date()
    )

    return new_activity


@router.post("/activity/{activity_id}/refresh-strava-data", response_model=schemas.Activity)
def refresh_strava_activity_data(activity_id: int, db: Session = Depends(get_db)):
    """Refreshes activity data from Strava, overwriting existing records."""
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")

    if db_activity.source != 'strava':
        raise HTTPException(status_code=400, detail="Activity is not from Strava")

    athlete = db_activity.athlete
    if not athlete or not athlete.strava_access_token:
        raise HTTPException(status_code=400, detail="Strava access token not available")

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
            athlete.strava_athlete_id,
        )
        athlete = crud.get_athlete(db, athlete.athlete_id)  # Refresh athlete data

    service = StravaService(athlete.strava_access_token)

    if not db_activity.strava_activity_id:
        raise HTTPException(status_code=400, detail="Strava activity ID not available")

    summary = service.get_activity_summary(db_activity.strava_activity_id)
    try:
        streams = service.get_activity_streams(db_activity.strava_activity_id)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            streams = {}
        else:
            raise

    # Delete existing records
    crud.delete_activity_records(db, activity_id)

    # Update activity summary fields
    db_activity.name = summary.get("name", db_activity.name)
    db_activity.total_moving_time = summary.get("moving_time", db_activity.total_moving_time)
    db_activity.total_elapsed_time = summary.get("elapsed_time", db_activity.total_elapsed_time)
    db_activity.total_distance = summary.get("distance", db_activity.total_distance)
    db_activity.average_speed = summary.get("average_speed", db_activity.average_speed)
    db_activity.max_speed = summary.get("max_speed", db_activity.max_speed)
    db_activity.average_heart_rate = summary.get("average_heartrate", db_activity.average_heart_rate)
    db_activity.max_heart_rate = summary.get("max_heartrate", db_activity.max_heart_rate)
    db_activity.average_power = summary.get("average_watts", db_activity.average_power)
    db_activity.max_power = summary.get("max_watts", db_activity.max_power)
    db_activity.total_elevation_gain = summary.get("total_elevation_gain", db_activity.total_elevation_gain)
    db_activity.average_cadence = summary.get("average_cadence", db_activity.average_cadence)
    db_activity.max_cadence = summary.get("max_cadence", db_activity.max_cadence)
    db_activity.total_calories = summary.get("calories", db_activity.total_calories)

    # Re-create records from streams
    time_data = streams.get("time", {}).get("data", [])
    if time_data:
        watts_data = streams.get("watts", {}).get("data", [])
        watts = watts_data + [None] * (len(time_data) - len(watts_data))
        heartrate_data = streams.get("heartrate", {}).get("data", [])
        heartrate = heartrate_data + [None] * (len(time_data) - len(heartrate_data))
        latlng_data = streams.get("latlng", {}).get("data", [])
        latlng = latlng_data + [None] * (len(time_data) - len(latlng_data))

        for i, timestamp in enumerate(time_data):
            record = models.ActivityRecord(
                activity_id=activity_id,
                timestamp=db_activity.start_time + timedelta(seconds=timestamp),
                power=watts[i] if watts[i] is not None else None,
                heart_rate=heartrate[i] if heartrate[i] is not None else None,
                latitude=latlng[i][0] if latlng[i] is not None else None,
                longitude=latlng[i][1] if latlng[i] is not None else None,
            )
            db.add(record)

    # Recalculate derived metrics
    services.activity_processing.recalculate_virtual_power(db, db_activity, 0)

    db.commit()
    db.refresh(db_activity)

    return db_activity


@router.post("/activity/manual/{athlete_id}", response_model=schemas.Activity)
def create_manual_activity(
    athlete_id: int,
    activity_data: schemas.ActivityCreateManual,
    db: Session = Depends(get_db),
):
    """
    Creates a new activity from manually entered data for a specific athlete.
    """
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")

    new_activity = crud.create_manual_activity(
        db=db, activity_data=activity_data, athlete_id=athlete_id
    )

    # After creating activity, update scaling factors and PMC
    services.athlete_services.update_scaling_factors(db, athlete_id)
    services.calculations.recalculate_pmc_from_date(
        db, athlete_id, new_activity.start_time.date()
    )

    return new_activity
