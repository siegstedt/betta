from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

from .equipment import Equipment

if TYPE_CHECKING:
    from .athlete import AthleteSummary

# --- ActivityRecord ---
class ActivityRecordBase(BaseModel):
    timestamp: datetime
    power: Optional[int] = None
    heart_rate: Optional[int] = None
    cadence: Optional[int] = None
    speed: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None

class ActivityRecord(ActivityRecordBase):
    record_id: int
    activity_id: int
    model_config = ConfigDict(from_attributes=True)

# --- ActivityLap ---
class ActivityLapBase(BaseModel):
    lap_number: int
    duration: Optional[int] = None
    distance: Optional[float] = None
    average_power: Optional[int] = None
    total_elevation_gain: Optional[float] = None
    average_speed: Optional[float] = None
    average_cadence: Optional[int] = None
    average_heart_rate: Optional[int] = None    

class ActivityLap(ActivityLapBase):
    lap_id: int
    activity_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Activity ---
class ActivityBase(BaseModel):
    name: str
    sport: Optional[str] = None
    sub_sport: Optional[str] = None    
    ride_type: Optional[str] = None
    bike_id: Optional[int] = None
    shoe_id: Optional[int] = None
    device_id: Optional[int] = None
    trainer_id: Optional[int] = None    
    description: Optional[str] = None
    start_time: datetime
    total_moving_time: Optional[int] = None
    total_elapsed_time: Optional[int] = None
    total_distance: Optional[float] = None
    total_elevation_gain: Optional[float] = None
    average_speed: Optional[float] = None
    max_speed: Optional[float] = None    
    average_cadence: Optional[int] = None
    max_cadence: Optional[int] = None
    average_heart_rate: Optional[int] = None
    max_heart_rate: Optional[int] = None    
    average_power: Optional[int] = None
    max_power: Optional[int] = None
    normalized_power: Optional[int] = None
    total_calories: Optional[int] = None
    perceived_exertion: Optional[int] = None
    perceived_strain_score: Optional[int] = None
    trimp: Optional[int] = None
    intensity_factor: Optional[float] = None
    unified_training_load: Optional[int] = None
    tss: Optional[int] = None

class ActivitySummary(ActivityBase):
    activity_id: int
    athlete_id: int
    model_config = ConfigDict(from_attributes=True)

class ActivityListResponse(BaseModel):
    """Simplified activity response for listings"""
    activity_id: int
    name: str
    sport: Optional[str] = None
    start_time: datetime
    total_distance: Optional[float] = None
    total_moving_time: Optional[int] = None
    average_power: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sport: Optional[str] = None
    sub_sport: Optional[str] = None
    ride_type: Optional[str] = None
    bike_id: Optional[int] = None
    shoe_id: Optional[int] = None
    device_id: Optional[int] = None
    trainer_id: Optional[int] = None
    trainer_setting: Optional[int] = None    
    perceived_exertion: Optional[int] = None

class ActivityCreateManual(BaseModel):
    name: str
    description: Optional[str] = None
    sport: str
    sub_sport: Optional[str] = None
    ride_type: Optional[str] = None
    perceived_exertion: Optional[int] = None
    start_time: datetime
    duration: int # in seconds
    distance: Optional[float] = None # in kilometers
    average_power: Optional[int] = None
    average_heart_rate: Optional[int] = None
    average_cadence: Optional[int] = None
    average_speed: Optional[float] = None
    bike_id: Optional[int] = None
    shoe_id: Optional[int] = None
    device_id: Optional[int] = None
    trainer_id: Optional[int] = None

class Activity(ActivitySummary):
    records: List[ActivityRecord] = []
    laps: List[ActivityLap] = []
    bike: Optional[Equipment] = None
    shoe: Optional[Equipment] = None
    device: Optional[Equipment] = None
    trainer: Optional[Equipment] = None
    model_config = ConfigDict(from_attributes=True)

class RecentActivityResponse(ActivitySummary):
    athlete_id: int
    athlete_first_name: str
    athlete_last_name: str
    model_config = ConfigDict(from_attributes=True)


# --- Visual Activity Log ---
class DailyActivity(BaseModel):
    activity_id: int
    name: str
    time: str  # formatted duration string

class ChartDataPoint(BaseModel):
    day: str  # 'Mon', 'Tue', etc.
    stack_index: int
    metric_value: float
    color: str
    daily_activities: List[DailyActivity]

class WeeklyActivityData(BaseModel):
    week_start_date: str  # ISO date string
    week_end_date: str    # ISO date string
    total_metric: float
    total_time: float
    total_distance: float
    total_load: float
    chart_data: List[ChartDataPoint]

class VisualActivityLogResponse(BaseModel):
    weeks: List[WeeklyActivityData]
