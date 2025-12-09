from sqlalchemy.orm import Session

import models
import schemas


def create_equipment(db: Session, equipment: schemas.EquipmentCreate, athlete_id: int):
    """Creates a new piece of equipment for an athlete."""
    db_equipment = models.Equipment(**equipment.model_dump(), athlete_id=athlete_id)
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def find_or_create_device(
    db: Session, athlete_id: int, brand: str, model: str
) -> models.Equipment:
    """Finds an existing device or creates a new one if it doesn't exist."""
    existing_device = get_equipment_by_brand_model_type(
        db, athlete_id, brand, model, models.EquipmentType.DEVICE
    )
    if existing_device:
        return existing_device

    device_name = f"{brand} {model}"
    new_device_schema = schemas.EquipmentCreate(
        name=device_name,
        equipment_type=models.EquipmentType.DEVICE,
        brand=brand,
        model=model,
    )
    return create_equipment(db, new_device_schema, athlete_id)


def get_equipment(db: Session, equipment_id: int):
    return (
        db.query(models.Equipment)
        .filter(models.Equipment.equipment_id == equipment_id)
        .first()
    )


def get_equipment_by_brand_model_type(
    db: Session, athlete_id: int, brand: str, model: str, eq_type: models.EquipmentType
):
    """Finds a piece of equipment by its brand, model, and type for a specific athlete."""
    return (
        db.query(models.Equipment)
        .filter_by(
            athlete_id=athlete_id, brand=brand, model=model, equipment_type=eq_type
        )
        .first()
    )


def update_equipment(
    db: Session, equipment_id: int, equipment_data: schemas.EquipmentUpdate
):
    db_equipment = get_equipment(db, equipment_id)
    if not db_equipment:
        return None

    update_data = equipment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_equipment, key, value)

    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def delete_equipment(db: Session, equipment_id: int):
    db_equipment = (
        db.query(models.Equipment)
        .filter(models.Equipment.equipment_id == equipment_id)
        .first()
    )
    if not db_equipment:
        return None
    db.delete(db_equipment)
    db.commit()
    return {"ok": True}
