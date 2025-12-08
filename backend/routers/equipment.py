from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(
    tags=["Equipment"],
)

@router.post("/athlete/{athlete_id}/equipment", response_model=schemas.Equipment, status_code=201)
def create_equipment_endpoint(athlete_id: int, equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    """Creates a new piece of equipment for an athlete."""
    db_athlete = crud.get_athlete(db, athlete_id=athlete_id)
    if db_athlete is None:
        raise HTTPException(status_code=404, detail="Athlete not found")
    return crud.create_equipment(db=db, equipment=equipment, athlete_id=athlete_id)

@router.get("/equipment/{equipment_id}", response_model=schemas.Equipment)
def read_equipment(equipment_id: int, db: Session = Depends(get_db)):
    """Retrieves a single piece of equipment by its ID."""
    db_equipment = crud.get_equipment(db, equipment_id=equipment_id)
    if db_equipment is None:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return db_equipment

@router.put("/equipment/{equipment_id}", response_model=schemas.Equipment)
def update_equipment_endpoint(equipment_id: int, equipment_data: schemas.EquipmentUpdate, db: Session = Depends(get_db)):
    """Updates a piece of equipment."""
    updated_equipment = crud.update_equipment(db=db, equipment_id=equipment_id, equipment_data=equipment_data)
    if updated_equipment is None:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return updated_equipment

@router.delete("/equipment/{equipment_id}", status_code=204)
def delete_equipment_endpoint(equipment_id: int, db: Session = Depends(get_db)):
    """Deletes a piece of equipment."""
    result = crud.delete_equipment(db, equipment_id=equipment_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return Response(status_code=204)

