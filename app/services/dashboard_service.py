"""Dashboard stats aggregation."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models


def build_dashboard(db: Session) -> dict:
    total_jobs = db.query(models.Job).count()
    high_matches = (
        db.query(models.JobMatch)
        .filter(models.JobMatch.score >= 80)
        .count()
    )
    applications = db.query(models.Application).count()
    applied_ids = {aid for (aid,) in db.query(models.Application.job_id).all()}
    high_match_ids = {jid for (jid,) in db.query(models.JobMatch.job_id).filter(models.JobMatch.score >= 80).all()}
    ready_to_apply = len(high_match_ids - applied_ids)
    people_to_contact = (
        db.query(models.Contact)
        .filter(models.Contact.name != "NOT FOUND", models.Contact.verified.is_(True))
        .count()
    )
    responses = (
        db.query(models.Application)
        .filter(models.Application.status.in_(["RESPONSE", "INTERVIEW", "OFFER"]))
        .count()
    )
    interviews = (
        db.query(models.Application).filter(models.Application.status == "INTERVIEW").count()
    )
    offers = db.query(models.Application).filter(models.Application.status == "OFFER").count()

    status_counts = dict(
        db.query(models.Application.status, func.count(models.Application.id))
        .group_by(models.Application.status)
        .all()
    )

    top_jobs = (
        db.query(models.Job, models.JobMatch)
        .join(models.JobMatch, models.JobMatch.job_id == models.Job.id)
        .order_by(models.JobMatch.score.desc())
        .limit(10)
        .all()
    )
    top = [
        {
            "id": job.id,
            "company": job.company,
            "role": job.role,
            "score": match.score,
            "recommendation": match.recommendation,
        }
        for job, match in top_jobs
    ]

    return {
        "stats": {
            "jobs_found": total_jobs,
            "high_matches": high_matches,
            "ready_to_apply": ready_to_apply,
            "applications": applications,
            "people_to_contact": people_to_contact,
            "responses": responses,
            "interviews": interviews,
            "offers": offers,
        },
        "top_jobs": top,
        "status_counts": status_counts,
    }
