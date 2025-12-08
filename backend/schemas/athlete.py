from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Optional

from .performance import AthleteMetric
from .activity import ActivitySummary
from .equipment import Equipment

class AthleteBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    profile_picture_url: Optional[str] = None

class AthleteCreate(AthleteBase):
    pass

class AthleteUpdate(AthleteBase):
    pass

class Athlete(AthleteBase):
    athlete_id: int
    created_at: datetime
    metrics: List[AthleteMetric] = []
    psf_trimp: float
    psf_pss: float
    activities: List[ActivitySummary] = []
    equipment: List[Equipment] = []
    model_config = ConfigDict(from_attributes=True)

