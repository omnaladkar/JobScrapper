"""Ready-to-apply queue.

Builds a daily list of top-matched jobs (recommendation APPLY) that do not yet
have an application. The action is to open the job's public apply link (ATS/careers
page) and submit there in-browser — no SMTP/email infrastructure needed.

This keeps the flow ban-safe (we never auto-submit or auto-fill forms) and
instant (no contact discovery or message generation on every load).
"""

from sqlalchemy.orm import Session

from app import models

APPLY_MIN_SCORE = 80


def build_queue(db: Session, limit: int = 25) -> dict:
    """Best-match jobs that still need an application, with their apply links."""
    rows = (
        db.query(models.Job)
        .join(models.JobMatch, models.JobMatch.job_id == models.Job.id)
        .filter(
            models.JobMatch.recommendation == "APPLY",
            models.JobMatch.score >= APPLY_MIN_SCORE,
        )
        .order_by(models.JobMatch.score.desc())
        .limit(limit)
        .all()
    )
    applied = {a.job_id for a in db.query(models.Application).all()}

    items = []
    for job in rows:
        if job.id in applied:
            continue
        apply_url = (job.apply_url or "").strip()
        items.append({
            "job_id": job.id,
            "company": job.company,
            "role": job.role,
            "location": job.location,
            "salary": job.salary,
            "score": job.match.score if job.match else 0,
            "apply_url": apply_url,
            "can_apply": bool(apply_url),
        })

    return {
        "items": items,
        "total": len(items),
    }