from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_user, require_admin

router = APIRouter(prefix="/api/voyages", tags=["voyages"])


@router.get("", response_model=schemas.VoyagePage)
def list_voyages(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    vessel_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    items, total = crud.list_voyages(
        db, skip=skip, limit=limit, search=search, status=status, vessel_id=vessel_id
    )
    return {"total": total, "skip": skip, "limit": limit, "items": items}


@router.get("/{voyage_id}", response_model=schemas.VoyageOut)
def get_voyage(voyage_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    voyage = crud.get_voyage(db, voyage_id)
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    return voyage


@router.post("", response_model=schemas.VoyageOut, status_code=201)
def create_voyage(data: schemas.VoyageCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    if not crud.get_vessel(db, data.vessel_id):
        raise HTTPException(status_code=400, detail=f"Vessel {data.vessel_id} does not exist")
    return crud.create_voyage(db, data)


@router.put("/{voyage_id}", response_model=schemas.VoyageOut)
def update_voyage(voyage_id: int, data: schemas.VoyageUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    voyage = crud.get_voyage(db, voyage_id)
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    if data.vessel_id is not None and not crud.get_vessel(db, data.vessel_id):
        raise HTTPException(status_code=400, detail=f"Vessel {data.vessel_id} does not exist")
    return crud.update_voyage(db, voyage, data)


@router.delete("/{voyage_id}", status_code=204)
def delete_voyage(voyage_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    voyage = crud.get_voyage(db, voyage_id)
    if not voyage:
        raise HTTPException(status_code=404, detail="Voyage not found")
    crud.delete_voyage(db, voyage)
