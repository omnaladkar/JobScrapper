from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("", response_model=list[schemas.ApplicationOut])
def list_applications(db: Session = Depends(get_db)):
    return db.query(models.Application).order_by(models.Application.created_at.desc()).all()


@router.post("", response_model=schemas.ApplicationOut, status_code=201)
def create_application(data: schemas.ApplicationIn, job_id: int = Query(...), db: Session = Depends(get_db)):
    app_row = models.Application(job_id=job_id, status=data.status or "NEW")
    if data.notes:
        app_row.notes = data.notes
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    return app_row


@router.patch("/{app_id}", response_model=schemas.ApplicationOut)
def update_application(app_id: int, data: schemas.ApplicationIn, db: Session = Depends(get_db)):
    app_row = db.query(models.Application).filter(models.Application.id == app_id).first()
    if not app_row:
        raise HTTPException(404, "Application not found")
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(app_row, k, v)
    db.commit()
    db.refresh(app_row)
    return app_row
