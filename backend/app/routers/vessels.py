from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/vessels", tags=["vessels"])


@router.get("", response_model=schemas.VesselPage)
def list_vessels(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    items, total = crud.list_vessels(db, skip=skip, limit=limit, search=search, status=status)
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get("/{vessel_id}", response_model=schemas.VesselOut)
def get_vessel(vessel_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    vessel = crud.get_vessel(db, vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return vessel


@router.post("", response_model=schemas.VesselOut, status_code=201)
def create_vessel(data: schemas.VesselCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    return crud.create_vessel(db, data)


@router.put("/{vessel_id}", response_model=schemas.VesselOut)
def update_vessel(vessel_id: int, data: schemas.VesselUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    vessel = crud.get_vessel(db, vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return crud.update_vessel(db, vessel, data)


@router.delete("/{vessel_id}", status_code=204)
def delete_vessel(vessel_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    vessel = crud.get_vessel(db, vessel_id)
    if not vessel:
        raise HTTPException(status_code=404, detail="Vessel not found")
    crud.delete_vessel(db, vessel)
