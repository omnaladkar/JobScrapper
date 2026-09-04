from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import apply_queue

router = APIRouter(prefix="/api/apply", tags=["apply"])


@router.get("/queue")
def queue(limit: int = 25, db: Session = Depends(get_db)):
    return apply_queue.build_queue(db, limit=limit)