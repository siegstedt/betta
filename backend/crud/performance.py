from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone, date
from typing import Optional

import models
import schemas


def create_athlete_metric(
    db: Session, metric: schemas.AthleteMetricCreate, athlete_id: int
):
    db_metric = models.AthleteMetric(**metric.model_dump(), athlete_id=athlete_id)
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric


def upsert_daily_metric(
    db: Session,
    athlete_id: int,
    date: date,
    ctl: float,
    atl: float,
    tsb: float,
    tss: int,
    if_avg: float,
):
    """Creates or updates a DailyPerformanceMetric entry for a specific date."""
    db_metric = (
        db.query(models.DailyPerformanceMetric)
        .filter_by(athlete_id=athlete_id, date=date)
        .first()
    )

    if db_metric:
        # Update existing metric
        db_metric.ctl = ctl
        db_metric.atl = atl
        db_metric.tsb = tsb
        db_metric.tss = tss
        db_metric.if_avg = if_avg
    else:
        # Create new metric
        db_metric = models.DailyPerformanceMetric(
            athlete_id=athlete_id,
            date=date,
            ctl=ctl,
            atl=atl,
            tsb=tsb,
            tss=tss,
            if_avg=if_avg,
        )
        db.add(db_metric)

    return db_metric


def get_latest_weight(
    db: Session, athlete_id: int, activity_date: Optional[datetime] = None
):
    """
    Gets the most recent weight established on or before the activity date.
    If no date is provided, gets the most current FTP.
    """
    if activity_date is None:
        activity_date = datetime.now(timezone.utc)

    return (
        db.query(models.AthleteMetric.value)
        .filter(models.AthleteMetric.athlete_id == athlete_id)
        .filter(models.AthleteMetric.metric_type == models.MetricType.WEIGHT)
        .filter(models.AthleteMetric.date_established <= activity_date.date())
        .order_by(desc(models.AthleteMetric.date_established))
        .first()
    )


def get_latest_lthr(
    db: Session, athlete_id: int, activity_date: Optional[datetime] = None
):
    """
    Gets the most recent LTHR established on or before the activity date.
    If no date is provided, gets the most current FTP.
    """
    if activity_date is None:
        activity_date = datetime.now(timezone.utc)

    return (
        db.query(models.AthleteMetric.value)
        .filter(models.AthleteMetric.athlete_id == athlete_id)
        .filter(models.AthleteMetric.metric_type == models.MetricType.THR)
        .filter(models.AthleteMetric.date_established <= activity_date.date())
        .order_by(desc(models.AthleteMetric.date_established))
        .first()
    )


def get_latest_ftp(
    db: Session, athlete_id: int, activity_date: Optional[datetime] = None
):
    """
    Gets the most recent FTP established on or before a given date.
    If no date is provided, gets the most current FTP.
    """
    if activity_date is None:
        activity_date = datetime.now(timezone.utc)

    return (
        db.query(models.AthleteMetric.value)
        .filter(models.AthleteMetric.athlete_id == athlete_id)
        .filter(models.AthleteMetric.metric_type == models.MetricType.FTP)
        .filter(models.AthleteMetric.date_established <= activity_date.date())
        .order_by(desc(models.AthleteMetric.date_established))
        .first()
    )


def get_metric_history(db: Session, athlete_id: int, metric_type: models.MetricType):
    """Retrieves the historical progression of a specific metric for an athlete."""
    return (
        db.query(models.AthleteMetric)
        .filter(models.AthleteMetric.athlete_id == athlete_id)
        .filter(models.AthleteMetric.metric_type == metric_type)
        .order_by(models.AthleteMetric.date_established)
        .all()
    )


def get_daily_activity_summary(db: Session, athlete_id: int, for_date: date):
    """
    Aggregates unified_training_load and calculates average IF for all activities on a specific date.
    """
    summary = (
        db.query(
            func.sum(models.Activity.unified_training_load).label("total_load"),
            func.avg(models.Activity.intensity_factor).label("avg_if"),
        )
        .filter(
            models.Activity.athlete_id == athlete_id,
            func.date(models.Activity.start_time) == for_date,
        )
        .one()
    )

    return {"total_tss": summary.total_load or 0, "avg_if": summary.avg_if or 0.0}


def get_latest_daily_metric(db: Session, athlete_id: int):
    """Gets the most recent DailyPerformanceMetric for an athlete."""
    return (
        db.query(models.DailyPerformanceMetric)
        .filter(models.DailyPerformanceMetric.athlete_id == athlete_id)
        .order_by(desc(models.DailyPerformanceMetric.date))
        .first()
    )


def get_latest_daily_metric_before_date(db: Session, athlete_id: int, date: date):
    """Gets the most recent DailyPerformanceMetric for an athlete before a given date."""
    return (
        db.query(models.DailyPerformanceMetric)
        .filter(models.DailyPerformanceMetric.athlete_id == athlete_id)
        .filter(models.DailyPerformanceMetric.date < date)
        .order_by(desc(models.DailyPerformanceMetric.date))
        .first()
    )


def get_pmc_data(db: Session, athlete_id: int, start_date: date, end_date: date):
    """Retrieves all DailyPerformanceMetric entries for an athlete within a date range."""
    return (
        db.query(models.DailyPerformanceMetric)
        .filter(models.DailyPerformanceMetric.athlete_id == athlete_id)
        .filter(models.DailyPerformanceMetric.date >= start_date)
        .filter(models.DailyPerformanceMetric.date <= end_date)
        .order_by(models.DailyPerformanceMetric.date)
        .all()
    )


def get_power_records_for_date_range(
    db: Session, athlete_id: int, start_date: date, end_date: date
):
    """Fetches all power data points for an athlete within a given date range."""
    return (
        db.query(models.ActivityRecord.power)
        .join(models.Activity)
        .filter(models.Activity.athlete_id == athlete_id)
        .filter(models.Activity.start_time >= start_date)
        .filter(models.Activity.start_time <= end_date)
        .order_by(models.ActivityRecord.timestamp)
        .all()
    )


def get_daily_aggregates_for_metric(
    db: Session,
    athlete_id: int,
    start_date: date,
    end_date: date,
    metric_column: str,
    agg_func,
):
    """
    Fetches and aggregates a specific metric (TSS, IF, etc.) by day for a given date range.
    Accepts a generic aggregation function (e.g., func.sum, func.avg).
    """
    metric_attr = getattr(models.Activity, metric_column, None)
    if metric_attr is None:
        raise ValueError(f"Invalid metric column: {metric_column}")

    return (
        db.query(
            func.date(models.Activity.start_time).label("date"),
            agg_func(metric_attr).label("total_value"),
        )
        .filter(
            models.Activity.athlete_id == athlete_id,
            func.date(models.Activity.start_time) >= start_date,
            func.date(models.Activity.start_time) <= end_date,
            metric_attr.isnot(None),
        )
        .group_by(func.date(models.Activity.start_time))
        .order_by(func.date(models.Activity.start_time))
        .all()
    )


def get_dual_data_aggregates(db: Session, athlete_id: int, metric_column: str):
    """
    Calculates the sum of TSS and the sum of another metric (TRIMP or PSS)
    for all activities where both are present and greater than zero.
    """
    metric_attr = getattr(models.Activity, metric_column)

    query_result = (
        db.query(
            func.sum(models.Activity.tss).label("total_tss"),
            func.sum(metric_attr).label("total_metric"),
            func.count(models.Activity.activity_id).label("activity_count"),
        )
        .filter(
            models.Activity.athlete_id == athlete_id,
            models.Activity.tss > 0,
            metric_attr > 0,
        )
        .one()
    )

    return query_result


def get_pending_markers(db: Session, athlete_id: int):
    """Retrieves all pending performance markers for an athlete."""
    return (
        db.query(models.PotentialPerformanceMarker)
        .filter_by(athlete_id=athlete_id, status=models.PotentialMarkerStatus.PENDING)
        .order_by(desc(models.PotentialPerformanceMarker.date_detected))
        .all()
    )
