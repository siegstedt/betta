from datetime import datetime, timezone
from sqlalchemy import Column, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship

from . import Base


class Athlete(Base):
    """
    The central user model. All data is linked to an athlete.
    """

    __tablename__ = "athletes"

    athlete_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date)
    profile_picture_url = Column(String)
    # Personalized Scaling Factors for training load harmonization
    psf_trimp = Column(Float, nullable=False, default=0.42)
    psf_pss = Column(Float, nullable=False, default=0.24)
    # Strava integration fields
    strava_access_token = Column(String, nullable=True)
    strava_refresh_token = Column(String, nullable=True)
    strava_expires_at = Column(DateTime, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    activities = relationship(
        "Activity", back_populates="athlete", cascade="all, delete-orphan"
    )
    metrics = relationship(
        "AthleteMetric", back_populates="athlete", cascade="all, delete-orphan"
    )
    equipment = relationship(
        "Equipment", back_populates="athlete", cascade="all, delete-orphan"
    )
    daily_metrics = relationship(
        "DailyPerformanceMetric", back_populates="athlete", cascade="all, delete-orphan"
    )
    potential_markers = relationship(
        "PotentialPerformanceMarker",
        back_populates="athlete",
        cascade="all, delete-orphan",
    )

    @property
    def is_strava_connected(self) -> bool:
        return self.strava_access_token is not None
