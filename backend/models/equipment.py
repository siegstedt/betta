import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLAlchemyEnum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from . import Base


class EquipmentType(str, enum.Enum):
    BIKE = "bike"
    SHOES = "shoes"
    TRAINER = "trainer"
    DEVICE = "device"


class Equipment(Base):
    """
    Stores gear used by an athlete (bikes, shoes, etc.).
    """

    __tablename__ = "equipment"

    equipment_id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.athlete_id"), nullable=False)

    equipment_type = Column(
        SQLAlchemyEnum(EquipmentType, name="equipment_type_enum"), nullable=False
    )
    name = Column(String, nullable=False)  # User-defined name, e.g., "Road Bike"
    brand = Column(String, nullable=True)
    model = Column(String, nullable=True)
    weight = Column(Float, nullable=True)  # Primarily for bikes
    notes = Column(String, nullable=True)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    athlete = relationship("Athlete", back_populates="equipment")
