from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from enum import Enum
from pydantic import BaseModel
from datetime import datetime, date, timedelta

import models
import schemas
import services
import crud
from database import get_db

router = APIRouter(
    prefix="/athlete/{athlete_id}",
    tags=["Performance Analysis"],
)

class WorkloadMetric(str, Enum):
    tss = "tss"
    pss = "pss"
    trimp = "trimp"
    if_avg = "intensity_factor"
    utl = "utl"


METRIC_COLUMN_MAP = {
    WorkloadMetric.tss: "tss",
    WorkloadMetric.pss: "perceived_strain_score",
    WorkloadMetric.trimp: "trimp",
    WorkloadMetric.if_avg: "intensity_factor",
    WorkloadMetric.utl: "unified_training_load"
}
    

@router.post("/metrics", response_model=schemas.AthleteMetric, status_code=201)
def create_athlete_metric(
    athlete_id: int, metric: schemas.AthleteMetricCreate, db: Session = Depends(get_db)
):
    """Adds a new metric (e.g., weight, FTP) for a specific athlete."""
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return crud.create_athlete_metric(db=db, metric=metric, athlete_id=athlete_id)


@router.get("/weight-at-date", response_model=Optional[float])
def get_weight_at_date(athlete_id: int, date: datetime, db: Session = Depends(get_db)):
    """
    Retrieves the athlete's most recent established weight on or before a given date.
    This is useful for calculating W/kg for historical activities.
    """
    weight_record = crud.get_latest_weight(db, athlete_id=athlete_id, activity_date=date)
    if weight_record:
        return weight_record[0]
    return None


@router.get("/ftp", response_model=Optional[float])
def get_ftp_at_date(athlete_id: int, date: Optional[datetime] = None, db: Session = Depends(get_db)):
    """
    Retrieves the athlete's most recent established FTP.
    If a 'date' query parameter is provided, it gets the FTP on or before that date.
    Otherwise, it returns the most current FTP.
    """
    ftp_record = crud.get_latest_ftp(db, athlete_id=athlete_id, activity_date=date)
    return ftp_record[0] if ftp_record else None


@router.get("/pmc", response_model=List[schemas.DailyPerformanceMetric])
def get_pmc_data_endpoint(
    athlete_id: int,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    """
    Retrieves historical and projected PMC data (CTL, ATL, TSB) for a given date range.
    It fills in any gaps (rest days) with calculated decayed values.
    """
    last_metric_before_range = crud.get_latest_daily_metric_before_date(db, athlete_id, start_date)
    
    if last_metric_before_range:
        ctl = last_metric_before_range.ctl   
        atl = last_metric_before_range.atl
    else:
        ctl, atl = 0.0, 0.0
    
    existing_metrics_raw = crud.get_pmc_data(db, athlete_id, start_date, end_date)
    existing_metrics_map = {metric.date: metric for metric in existing_metrics_raw}
    
    all_days_metrics = []
    current_date = start_date
    
    while current_date <= end_date:    
        if current_date in existing_metrics_map:
            metric = existing_metrics_map[current_date]
            ctl = metric.ctl
            atl = metric.atl
            all_days_metrics.append(metric)
    
        else:
            ctl += (0 - ctl) / services.calculations.CTL_TC
            atl += (0 - atl) / services.calculations.ATL_TC
            tsb = ctl - atl
            
            transient_metric = schemas.DailyPerformanceMetric(
                id=0, athlete_id=athlete_id, date=current_date,
                ctl=ctl, atl=atl, tsb=tsb, tss=0, if_avg=0.0
            )
            all_days_metrics.append(transient_metric)
    
        current_date += timedelta(days=1)

    return all_days_metrics


@router.get("/mmp-curve", response_model=List[Dict[str, int]])
def get_mmp_curve_endpoint(
    athlete_id: int, start_date: date, end_date: date, db: Session = Depends(get_db)
):
    """Calculates the Mean Maximal Power curve from all activities in a date range."""
    power_records = crud.get_power_records_for_date_range(db, athlete_id, start_date, end_date)
    power_data = [r[0] for r in power_records if r[0] is not None]
    intervals = [1, 5, 10, 15, 30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 900, 1200, 1800, 2700, 3600]
    mmp_curve = services.calculations.calculate_historical_mmp(power_data, intervals)
    return mmp_curve


@router.get("/metric-history", response_model=List[schemas.AthleteMetric])
def get_metric_history_endpoint(
    athlete_id: int, metric_type: models.MetricType, db: Session = Depends(get_db)
):
    """Retrieves the historical progression of a specific metric (e.g., 'ftp', 'weight')."""
    return crud.get_metric_history(db, athlete_id=athlete_id, metric_type=metric_type)


@router.get("/weekly-workload", response_model=schemas.WeeklyWorkload)
def get_weekly_workload_endpoint(
    athlete_id: int,
    metric: WorkloadMetric,
    activity_date: date, # The date of the activity we are viewing
    db: Session = Depends(get_db)
):
    """
    Calculates and returns the data needed for the Weekly Workload visualization.
    """
    # Fetch data for the last 16 weeks to build a reliable 4-week rolling average for the last 12 weeks.
    history_start_date = activity_date - timedelta(weeks=16)

    # We need to fetch data for the entire week the activity is in, not just up to the activity date.
    # Calculate the end of the week (Sunday) for the given activity_date.
    week_end_date = activity_date + timedelta(days=6 - activity_date.weekday())

    metric_column = METRIC_COLUMN_MAP.get(metric)
    if not metric_column:
        raise HTTPException(status_code=400, detail=f"Invalid metric type for workload analysis: {metric}")    
    
    # Use AVG for intensity metrics and SUM for load metrics
    agg_func = func.avg if metric == WorkloadMetric.if_avg else func.sum
    
    daily_aggregates = crud.get_daily_aggregates_for_metric(
        db, 
        athlete_id=athlete_id, 
        start_date=history_start_date, 
        end_date=week_end_date, 
        metric_column=metric_column,
        agg_func=agg_func
    )
    
    return services.activity_processing.process_weekly_workload(daily_aggregates, activity_date)


@router.get("/potential-markers", response_model=List[schemas.PotentialPerformanceMarker])
def get_potential_markers(athlete_id: int, db: Session = Depends(get_db)):
    """Retrieves all pending potential performance markers for an athlete."""
    return crud.get_pending_markers(db, athlete_id=athlete_id)

class MarkerAction(BaseModel):
    action: str # "accept" or "dismiss"


@router.put("/potential-markers/{marker_id}", response_model=schemas.PotentialPerformanceMarker)
def action_on_potential_marker(athlete_id: int, marker_id: int, marker_action: MarkerAction, db: Session = Depends(get_db)):
    """Accepts or dismisses a potential performance marker."""
    marker = db.query(models.PotentialPerformanceMarker).filter(models.PotentialPerformanceMarker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="Marker not found")

    # Security check: ensure the marker belongs to the athlete in the URL
    if marker.athlete_id != athlete_id:
        raise HTTPException(status_code=403, detail="Marker does not belong to this athlete")

    if marker_action.action == "accept":
        # Create a new official AthleteMetric
        new_metric = schemas.AthleteMetricCreate(
            metric_type=marker.metric_type,
            value=marker.value,
            date_established=marker.date_detected.date()
        )
        crud.create_athlete_metric(db, metric=new_metric, athlete_id=marker.athlete_id)
        
        marker.status = models.PotentialMarkerStatus.ACCEPTED
    elif marker_action.action == "dismiss":
        marker.status = models.PotentialMarkerStatus.DISMISSED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'accept' or 'dismiss'.")

    db.commit()
    db.refresh(marker)
    return marker



@router.get("/daily-workload-for-week", response_model=List[schemas.DailyAggregate])
async def get_daily_workload_for_week_endpoint(
    athlete_id: int,
    metric: WorkloadMetric,
    week_start_date: date, # The start date of the week (e.g., Monday)
    db: Session = Depends(get_db)
):
    """
    Retrieves daily workload aggregates for a specific week (Monday to Sunday).
    """
    metric_column = METRIC_COLUMN_MAP.get(metric)
    if not metric_column:
        raise HTTPException(status_code=400, detail=f"Invalid metric type for workload analysis: {metric}")

    # Ensure week_start_date is actually a Monday
    if week_start_date.weekday() != 0: # Monday is 0
        raise HTTPException(status_code=400, detail="week_start_date must be a Monday.")

    week_end_date = week_start_date + timedelta(days=6)

    # Use AVG for intensity metrics and SUM for load metrics
    agg_func = func.avg if metric == WorkloadMetric.if_avg else func.sum

    daily_aggregates = crud.get_daily_aggregates_for_metric(
        db,
        athlete_id=athlete_id,
        start_date=week_start_date,
        end_date=week_end_date,
        metric_column=metric_column,
        agg_func=agg_func
    )
    return daily_aggregates