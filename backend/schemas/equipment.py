from pydantic import BaseModel, ConfigDict
from typing import Optional

from models.equipment import EquipmentType

class EquipmentBase(BaseModel):
    name: str
    equipment_type: EquipmentType
    brand: Optional[str] = None
    model: Optional[str] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    equipment_type: Optional[EquipmentType] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

class Equipment(EquipmentBase):
    equipment_id: int
    athlete_id: int
    model_config = ConfigDict(from_attributes=True)

