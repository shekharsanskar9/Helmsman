from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/api", tags=["stats"])


@router.get("/stats", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return crud.get_stats(db)
