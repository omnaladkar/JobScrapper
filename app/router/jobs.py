from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import job_service, contact_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _job_out(job: models.Job, db: Session = None) -> dict:
    match = None
    m = job.match
    if db is not None and job.match is None:
        m = db.query(models.JobMatch).filter(models.JobMatch.job_id == job.id).first()
    if m:
        match = {
            "id": m.id,
            "score": m.score,
            "skills_score": m.skills_score,
            "experience_score": m.experience_score,
            "role_score": m.role_score,
            "location_score": m.location_score,
            "salary_score": m.salary_score,
            "company_score": m.company_score,
            "matched_skills": m.matched_skills,
            "missing_skills": m.missing_skills,
            "reasons": m.reasons,
            "recommendation": m.recommendation,
            "computed_at": m.computed_at,
        }
    return {
        "id": job.id,
        "company": job.company,
        "role": job.role,
        "location": job.location,
        "experience": job.experience,
        "posted_date": job.posted_date,
        "description": job.description,
        "apply_url": job.apply_url,
        "source": job.source,
        "salary": job.salary,
        "is_manual": job.is_manual,
        "created_at": job.created_at,
        "match": match,
    }


@router.get("", response_model=list[schemas.JobOut])
def list_jobs(
    q: str = "",
    location: str = "",
    min_score: float = Query(0.0),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    jobs = job_service.search_jobs(
        db, query=q, locations=[location] if location else [], limit=limit, min_score=min_score
    )
    return [_job_out(j, db) for j in jobs]


@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return _job_out(job, db)


@router.post("", response_model=schemas.JobOut, status_code=201)
def create_job(data: schemas.JobIn, db: Session = Depends(get_db)):
    existing = db.query(models.Job).filter(models.Job.apply_url == data.apply_url).first()
    if existing:
        return _job_out(existing, db)
    job = job_service.add_manual_job(db, data.model_dump())
    return _job_out(job, db)


@router.post("/scrape", status_code=202)
def trigger_scrape(db: Session = Depends(get_db)):
    new_count = job_service.refresh_scrape(db)
    return {"status": "ok", "new_jobs": new_count}


@router.post("/seed", status_code=200)
def seed_jobs(db: Session = Depends(get_db)):
    """Load previously-scraped jobs from output/jobs_*.json into the DB."""
    added = job_service.seed_from_output_files(db)
    total = db.query(models.Job).count()
    return {"status": "ok", "new_jobs": added, "total_jobs": total}


@router.post("/{job_id}/contacts", response_model=list[schemas.ContactOut])
def ensure_contacts(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    contacts = contact_service.find_contacts_for_job(db, job, force=True)
    return contacts
