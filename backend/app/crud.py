from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload
from . import models, schemas


# ═══════════════════════════ Vessels ═══════════════════════════
def list_vessels(db: Session, skip: int = 0, limit: int = 20,
                 search: Optional[str] = None, status: Optional[str] = None):
    query = select(models.Vessel)
    if search:
        query = query.where(models.Vessel.name.ilike(f"%{search}%"))
    if status:
        query = query.where(models.Vessel.status == status)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(query.order_by(models.Vessel.id).offset(skip).limit(limit)).all()
    return items, total


def get_vessel(db: Session, vessel_id: int):
    return db.get(models.Vessel, vessel_id)


def create_vessel(db: Session, data: schemas.VesselCreate):
    vessel = models.Vessel(**data.model_dump())
    db.add(vessel)
    db.commit()
    db.refresh(vessel)
    return vessel


def update_vessel(db: Session, vessel: models.Vessel, data: schemas.VesselUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(vessel, field, value)
    db.commit()
    db.refresh(vessel)
    return vessel


def delete_vessel(db: Session, vessel: models.Vessel):
    db.delete(vessel)          # ORM cascade removes the vessel's voyages and their cargo
    db.commit()


# ═══════════════════════════ Voyages ═══════════════════════════
def _attach_cargo_counts(db: Session, voyages):
    """Populate a non-persisted `cargo_count` on each voyage via one grouped query
    (keeps list responses N+1-free instead of loading every cargo row)."""
    ids = [v.id for v in voyages]
    counts = {}
    if ids:
        rows = db.execute(
            select(models.Cargo.voyage_id, func.count())
            .where(models.Cargo.voyage_id.in_(ids))
            .group_by(models.Cargo.voyage_id)
        ).all()
        counts = {voyage_id: n for voyage_id, n in rows}
    for v in voyages:
        v.cargo_count = counts.get(v.id, 0)


def list_voyages(db: Session, skip: int = 0, limit: int = 20,
                 search: Optional[str] = None, status: Optional[str] = None,
                 vessel_id: Optional[int] = None):
    query = select(models.Voyage)
    if search:
        like = f"%{search}%"
        query = query.where(
            models.Voyage.voyage_number.ilike(like)
            | models.Voyage.origin_port.ilike(like)
            | models.Voyage.destination_port.ilike(like)
        )
    if status:
        query = query.where(models.Voyage.status == status)
    if vessel_id:
        query = query.where(models.Voyage.vessel_id == vessel_id)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.options(selectinload(models.Voyage.vessel))
        .order_by(models.Voyage.id)
        .offset(skip)
        .limit(limit)
    ).all()
    _attach_cargo_counts(db, items)
    return items, total


def get_voyage(db: Session, voyage_id: int):
    voyage = db.get(models.Voyage, voyage_id)
    if voyage is not None:
        _attach_cargo_counts(db, [voyage])
    return voyage


def create_voyage(db: Session, data: schemas.VoyageCreate):
    voyage = models.Voyage(**data.model_dump())
    db.add(voyage)
    db.commit()
    db.refresh(voyage)
    _attach_cargo_counts(db, [voyage])
    return voyage


def update_voyage(db: Session, voyage: models.Voyage, data: schemas.VoyageUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(voyage, field, value)
    db.commit()
    db.refresh(voyage)
    _attach_cargo_counts(db, [voyage])
    return voyage


def delete_voyage(db: Session, voyage: models.Voyage):
    db.delete(voyage)          # ORM cascade removes this voyage's cargo
    db.commit()


# ═══════════════════════════ Cargo ═══════════════════════════
def list_cargo(db: Session, skip: int = 0, limit: int = 20,
               search: Optional[str] = None, cargo_type: Optional[str] = None,
               voyage_id: Optional[int] = None):
    query = select(models.Cargo)
    if search:
        query = query.where(models.Cargo.description.ilike(f"%{search}%"))
    if cargo_type:
        query = query.where(models.Cargo.cargo_type == cargo_type)
    if voyage_id:
        query = query.where(models.Cargo.voyage_id == voyage_id)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.options(selectinload(models.Cargo.voyage))
        .order_by(models.Cargo.id)
        .offset(skip)
        .limit(limit)
    ).all()
    return items, total


def get_cargo(db: Session, cargo_id: int):
    return db.get(models.Cargo, cargo_id)


def create_cargo(db: Session, data: schemas.CargoCreate):
    cargo = models.Cargo(**data.model_dump())
    db.add(cargo)
    db.commit()
    db.refresh(cargo)
    return cargo


def update_cargo(db: Session, cargo: models.Cargo, data: schemas.CargoUpdate):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(cargo, field, value)
    db.commit()
    db.refresh(cargo)
    return cargo


def delete_cargo(db: Session, cargo: models.Cargo):
    db.delete(cargo)
    db.commit()


# ═══════════════════════════ Stats ═══════════════════════════
def _counts_by(db: Session, column) -> dict:
    rows = db.execute(select(column, func.count()).group_by(column)).all()
    return {key: count for key, count in rows}


def get_stats(db: Session) -> dict:
    vessels_by_status = _counts_by(db, models.Vessel.status)
    voyages_by_status = _counts_by(db, models.Voyage.status)
    cargo_by_type = _counts_by(db, models.Cargo.cargo_type)

    total_weight = db.scalar(select(func.coalesce(func.sum(models.Cargo.weight_tonnes), 0.0)))
    hazardous_count = db.scalar(
        select(func.count()).select_from(models.Cargo).where(models.Cargo.hazardous.is_(True))
    )

    return {
        "vessels": {"total": sum(vessels_by_status.values()), "by_status": vessels_by_status},
        "voyages": {"total": sum(voyages_by_status.values()), "by_status": voyages_by_status},
        "cargo": {
            "total": sum(cargo_by_type.values()),
            "by_type": cargo_by_type,
            "total_weight_tonnes": total_weight,
            "hazardous_count": hazardous_count,
        },
    }


# ═══════════════════════════ Users ═══════════════════════════
def get_user_by_email(db: Session, email: str):
    return db.scalar(select(models.User).where(models.User.email == email))


def create_user(db: Session, email: str, hashed_password: str, role: str = "viewer"):
    user = models.User(email=email, hashed_password=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
