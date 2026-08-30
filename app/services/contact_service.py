"""Contact finder.

For high-match jobs, find probable recruiters/employees using ONLY the job's own data
(company + role). We do NOT fabricate people. When we cannot verify an actual person,
we return a 'NOT FOUND' placeholder with confidence 0.0.

The real people lookup requires a people-data API (e.g. ProxyCurl). Until that is wired
up (Phase 3), we return NOT FOUND by default and let the user attach real contacts later.
"""

from sqlalchemy.orm import Session

from app import models


def _best_guess_contacts(job: models.Job):
    """Generate candidate contacts from job data alone.
    These are *suggested roles* a hiring team would have, NOT names of real people.
    Verified flag is always False; confidence low.
    """
    company = job.company or ""
    candidates = []
    # Recruiter slot (role-level suggestion only)
    candidates.append({
        "name": "NOT FOUND",
        "role": "Technical Recruiter",
        "company": company,
        "contact_type": "recruiter",
        "profile_url": "",
        "source": "role-derived (unverified)",
        "confidence": 0.0,
        "relevance": 0.0,
        "reason": "No verified technical recruiter found. Attach a real contact after checking the job posting.",
        "verified": False,
    })
    # Employee slot
    role_hint = job.role or ""
    person_role = "Backend Engineer" if any(k in role_hint.lower() for k in ["backend", "java", "spring", "back-end"]) else "Software Engineer"
    candidates.append({
        "name": "NOT FOUND",
        "role": person_role,
        "company": company,
        "contact_type": "employee",
        "profile_url": "",
        "source": "role-derived (unverified)",
        "confidence": 0.0,
        "relevance": 0.0,
        "reason": "No verified employee found. Add a real referrer via the contact tab.",
        "verified": False,
    })
    return candidates


def find_contacts_for_job(db: Session, job: models.Job, force: bool = False):
    """Returns the saved contact rows for a job. If none exist and force=True, seed NOT FOUND placeholders."""
    existing = db.query(models.Contact).filter(models.Contact.job_id == job.id).all()
    if existing:
        return existing
    if not force:
        return []
    rows = []
    for c in _best_guess_contacts(job):
        row = models.Contact(
            job_id=job.id,
            name=c["name"],
            role=c["role"],
            company=c["company"],
            contact_type=c["contact_type"],
            profile_url=c["profile_url"],
            source=c["source"],
            confidence=c["confidence"],
            relevance=c["relevance"],
            reason=c["reason"],
            verified=c["verified"],
        )
        db.add(row)
        rows.append(row)
    db.commit()
    for r in rows:
        db.refresh(r)
    return rows


def add_contact(db: Session, job_id: int, data: dict) -> models.Contact:
    row = models.Contact(
        job_id=job_id,
        name=data.get("name", ""),
        role=data.get("role", ""),
        company=data.get("company", ""),
        contact_type=data.get("contact_type", "employee"),
        profile_url=data.get("profile_url", ""),
        source=data.get("source", "manual"),
        confidence=data.get("confidence", 0.8),
        relevance=data.get("relevance", 0.0),
        reason=data.get("reason", ""),
        verified=data.get("verified", True),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
