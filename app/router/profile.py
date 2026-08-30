from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import profile_service, resume_service

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=schemas.ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    profile = profile_service.get_or_create_profile(db)
    d = profile_service.to_dict_with_defaults(profile)
    return {
        "id": profile.id,
        "name": d["name"],
        "target_roles": d["target_roles"],
        "skills": d["skills"],
        "experience_years": d["experience_years"],
        "target_salary_min_lpa": d["target_salary_min_lpa"],
        "preferred_locations": d["preferred_locations"],
        "company_priorities": d["company_priorities"],
    }


@router.patch("", response_model=schemas.ProfileOut)
def update_profile(data: schemas.ProfileIn, db: Session = Depends(get_db)):
    profile = profile_service.get_or_create_profile(db)
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    d = profile_service.to_dict_with_defaults(profile)
    return {
        "id": profile.id,
        "name": d["name"],
        "target_roles": d["target_roles"],
        "skills": d["skills"],
        "experience_years": d["experience_years"],
        "target_salary_min_lpa": d["target_salary_min_lpa"],
        "preferred_locations": d["preferred_locations"],
        "company_priorities": d["company_priorities"],
    }


@router.post("/resume", response_model=schemas.ResumeOut, status_code=201)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")
    resume = resume_service.save_resume_upload(db, file.filename or "resume", content)
    return resume


@router.get("/resume", response_model=list[schemas.ResumeOut])
def list_resumes(db: Session = Depends(get_db)):
    resumes = db.query(models.Resume).order_by(models.Resume.uploaded_at.desc()).all()
    return resumes
