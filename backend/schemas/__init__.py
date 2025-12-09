from .activity import (
    Activity,
    ActivityCreateManual,
    ActivitySummary,
    ActivityUpdate,
    RecentActivityResponse,
    VisualActivityLogResponse,
)
from .athlete import (
    AthleteCreate,
    AthleteResponse,
    AthleteUpdate,
)
from .equipment import (
    Equipment,
    EquipmentCreate,
    EquipmentUpdate,
)
from .performance import (
    AthleteMetric,
    AthleteMetricCreate,
    DailyAggregate,
    DailyPerformanceMetric,
    PotentialPerformanceMarker,
    WeeklyWorkload,
    ZoneAnalysis,
)

__all__ = [
    # Activity schemas
    "Activity",
    "ActivityCreateManual",
    "ActivitySummary",
    "ActivityUpdate",
    "RecentActivityResponse",
    "VisualActivityLogResponse",
    # Athlete schemas
    "AthleteCreate",
    "AthleteResponse",
    "AthleteUpdate",
    # Equipment schemas
    "Equipment",
    "EquipmentCreate",
    "EquipmentUpdate",
    # Performance schemas
    "AthleteMetric",
    "AthleteMetricCreate",
    "DailyAggregate",
    "DailyPerformanceMetric",
    "PotentialPerformanceMarker",
    "WeeklyWorkload",
    "ZoneAnalysis",
]
