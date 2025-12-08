from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional, List

from models.performance import MetricType, PotentialMarkerStatus

# --- AthleteMetric ---
class AthleteMetricBase(BaseModel):
    metric_type: MetricType
    value: float
    date_established: date

class AthleteMetricCreate(AthleteMetricBase):
    pass

class AthleteMetric(AthleteMetricBase):
    metric_id: int
    athlete_id: int
    model_config = ConfigDict(from_attributes=True)

class ZoneAnalysis(BaseModel):
    power_zones: Optional[dict[str, int]] = None
    hr_zones: Optional[dict[str, int]] = None
    ftp: Optional[int] = None
    lthr: Optional[int] = None

# --- DailyPerformanceMetric ---
class DailyPerformanceMetricBase(BaseModel):
    date: date
    ctl: float
    atl: float
    tsb: float
    tss: Optional[int] = None
    if_avg: Optional[float] = None

class DailyPerformanceMetric(DailyPerformanceMetricBase):
    id: int
    athlete_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Weekly Workload ---
class WeeklyWorkloadDataPoint(BaseModel):
    week_start_date: date
    weekly_total: float
    rolling_avg: float
    rolling_std_upper: float
    rolling_std_lower: float

class WeeklyWorkload(BaseModel):
    weeks: List[WeeklyWorkloadDataPoint]


# --- Daily Aggregate for generic metrics ---
class DailyAggregate(BaseModel):
    date: date
    total_value: float
    model_config = ConfigDict(from_attributes=True)


# --- Potential Performance Markers ---    
class PotentialPerformanceMarkerBase(BaseModel):
    metric_type: MetricType
    value: float
    date_detected: datetime

class PotentialPerformanceMarkerCreate(PotentialPerformanceMarkerBase):
    pass

class PotentialPerformanceMarker(PotentialPerformanceMarkerBase):
    id: int
    athlete_id: int
    activity_id: int
    status: PotentialMarkerStatus

    model_config = ConfigDict(from_attributes=True)

