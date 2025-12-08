from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from . import Base

class Activity(Base):
    """
    Summary data for a single activity/ride.
    """
    __tablename__ = 'activities'

    activity_id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey('athletes.athlete_id'), nullable=False)
    bike_id = Column(Integer, ForeignKey('equipment.equipment_id'), nullable=True)
    shoe_id = Column(Integer, ForeignKey('equipment.equipment_id'), nullable=True)
    device_id = Column(Integer, ForeignKey('equipment.equipment_id'), nullable=True)
    trainer_id = Column(Integer, ForeignKey('equipment.equipment_id'), nullable=True)    
    fit_file_path = Column(String, nullable=True) # Path to the original .fit file
    
    name = Column(String, default="New Activity")
    sport = Column(String, nullable=True)
    sub_sport = Column(String, nullable=True)
    ride_type = Column(String, nullable=True)
    
    start_time = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    
    average_heart_rate = Column(Integer)
    max_heart_rate = Column(Integer, nullable=True)

    total_moving_time = Column(Integer)  # In seconds
    total_elapsed_time = Column(Integer, nullable=True) # In seconds
    total_distance = Column(Float)  # In meters
    total_elevation_gain = Column(Float)  # In meters
    average_speed = Column(Float, nullable=True) # in m/s
    max_speed = Column(Float, nullable=True) # in m/s    
    average_cadence = Column(Integer)
    max_cadence = Column(Integer, nullable=True)

    average_power = Column(Integer, nullable=True)
    max_power = Column(Integer, nullable=True)
    normalized_power = Column(Integer)

    total_calories = Column(Integer, nullable=True)
    perceived_exertion = Column(Integer, nullable=True)
    perceived_strain_score = Column(Integer, nullable=True)
    trimp = Column(Integer, nullable=True)    
    intensity_factor = Column(Float)
    tss = Column(Integer)
    unified_training_load = Column(Integer, nullable=True)    

    # Relationships
    athlete = relationship("Athlete", back_populates="activities")
    records = relationship("ActivityRecord", back_populates="activity", cascade="all, delete-orphan")
    bike = relationship("Equipment", foreign_keys=[bike_id])
    shoe = relationship("Equipment", foreign_keys=[shoe_id])
    device = relationship("Equipment", foreign_keys=[device_id])
    trainer = relationship("Equipment", foreign_keys=[trainer_id])    
    laps = relationship("ActivityLap", back_populates="activity", cascade="all, delete-orphan")
    potential_markers = relationship("PotentialPerformanceMarker", back_populates="activity", cascade="all, delete-orphan")


class ActivityRecord(Base):
    """
    Detailed, second-by-second time-series data for an activity.
    """
    __tablename__ = 'activity_records'

    record_id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey('activities.activity_id'), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    power = Column(Integer)
    heart_rate = Column(Integer)
    cadence = Column(Integer)
    speed = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    altitude = Column(Float)

    # Relationship
    activity = relationship("Activity", back_populates="records")


class ActivityLap(Base):
    """
    Stores summary data for each lap within a ride.
    """
    __tablename__ = 'activity_laps'

    lap_id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey('activities.activity_id'), nullable=False)
    lap_number = Column(Integer, nullable=False)
    duration = Column(Integer)  # seconds
    distance = Column(Float)  # meters
    average_power = Column(Integer)
    total_elevation_gain = Column(Float)
    average_speed = Column(Float)
    average_cadence = Column(Integer)
    average_heart_rate = Column(Integer)

    # Relationship
    activity = relationship("Activity", back_populates="laps")

