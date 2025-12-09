from sqlalchemy.orm import declarative_base

# The declarative base that all models will inherit from
Base = declarative_base()

# Import all models so they are registered with the Base and can be imported from the package
from .activity import Activity, ActivityRecord, ActivityLap  # noqa: E402
from .athlete import Athlete  # noqa: E402
from .equipment import Equipment, EquipmentType  # noqa: E402
from .performance import (  # noqa: E402
    AthleteMetric,
    DailyPerformanceMetric,
    MetricType,
    PotentialPerformanceMarker,
    PotentialMarkerStatus,
)

__all__ = [
    "Base",
    "Activity",
    "ActivityRecord",
    "ActivityLap",
    "Athlete",
    "Equipment",
    "EquipmentType",
    "AthleteMetric",
    "DailyPerformanceMetric",
    "MetricType",
    "PotentialPerformanceMarker",
    "PotentialMarkerStatus",
]
