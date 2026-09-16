from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/cargo", tags=["cargo"])


@router.get("", response_model=schemas.CargoPage)
def list_cargo(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    cargo_type: Optional[str] = None,
    voyage_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    items, total = crud.list_cargo(
        db, skip=skip, limit=limit, search=search, cargo_type=cargo_type, voyage_id=voyage_id
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get("/{cargo_id}", response_model=schemas.CargoOut)
def get_cargo(cargo_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cargo = crud.get_cargo(db, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    return cargo


@router.post("", response_model=schemas.CargoOut, status_code=201)
def create_cargo(data: schemas.CargoCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    if not crud.get_voyage(db, data.voyage_id):
        raise HTTPException(status_code=400, detail=f"Voyage {data.voyage_id} does not exist")
    return crud.create_cargo(db, data)


@router.put("/{cargo_id}", response_model=schemas.CargoOut)
def update_cargo(cargo_id: int, data: schemas.CargoUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    cargo = crud.get_cargo(db, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    if data.voyage_id is not None and not crud.get_voyage(db, data.voyage_id):
        raise HTTPException(status_code=400, detail=f"Voyage {data.voyage_id} does not exist")
    return crud.update_cargo(db, cargo, data)


@router.delete("/{cargo_id}", status_code=204)
def delete_cargo(cargo_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    cargo = crud.get_cargo(db, cargo_id)
    if not cargo:
        raise HTTPException(status_code=404, detail="Cargo not found")
    crud.delete_cargo(db, cargo)
