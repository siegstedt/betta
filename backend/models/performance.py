import enum
from sqlalchemy import Column, Date, DateTime, Enum as SQLAlchemyEnum, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship

from . import Base

# Python enum for metric types to ensure data consistency
class MetricType(str, enum.Enum):
    WEIGHT = 'weight'
    FTP = 'ftp'
    THR = 'thr'


class PotentialMarkerStatus(str, enum.Enum):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    DISMISSED = 'dismissed'


class AthleteMetric(Base):
    """
    Historical log of key physiological data (e.g., weight, FTP).
    """
    __tablename__ = 'athlete_metrics'

    metric_id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey('athletes.athlete_id'), nullable=False)
    metric_type = Column(SQLAlchemyEnum(MetricType, name='metric_type_enum'), nullable=False)
    value = Column(Float, nullable=False)
    date_established = Column(Date, nullable=False)

    # Relationship
    athlete = relationship("Athlete", back_populates="metrics")


class DailyPerformanceMetric(Base):
    """
    Stores the daily calculated performance metrics (CTL, ATL, TSB) for an athlete.
    """
    __tablename__ = 'daily_performance_metrics'

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey('athletes.athlete_id'), nullable=False)
    date = Column(Date, nullable=False, index=True)
    ctl = Column(Float, default=0.0)
    atl = Column(Float, default=0.0)
    tsb = Column(Float, default=0.0)
    tss = Column(Integer, nullable=True)
    if_avg = Column(Float, nullable=True)

    # Relationship
    athlete = relationship("Athlete", back_populates="daily_metrics")


class PotentialPerformanceMarker(Base):
    """
    Stores potential new FTP or LTHR values detected from activities.
    These are presented to the user for confirmation.
    """
    __tablename__ = 'potential_markers'

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey('athletes.athlete_id'), nullable=False)
    activity_id = Column(Integer, ForeignKey('activities.activity_id'), nullable=False)
    
    metric_type = Column(SQLAlchemyEnum(MetricType, name='potential_metric_type_enum'), nullable=False)
    value = Column(Float, nullable=False)
    date_detected = Column(DateTime, nullable=False)
    status = Column(SQLAlchemyEnum(PotentialMarkerStatus, name='potential_marker_status_enum'), nullable=False, default=PotentialMarkerStatus.PENDING)

    athlete = relationship("Athlete", back_populates="potential_markers")
    activity = relationship("Activity", back_populates="potential_markers")

