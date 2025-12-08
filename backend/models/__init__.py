from sqlalchemy.orm import declarative_base

# The declarative base that all models will inherit from
Base = declarative_base()

# Import all models so they are registered with the Base and can be imported from the package
from .activity import Activity, ActivityRecord, ActivityLap
from .athlete import Athlete
from .equipment import Equipment, EquipmentType
from .performance import AthleteMetric, DailyPerformanceMetric, MetricType, PotentialPerformanceMarker, PotentialMarkerStatus

