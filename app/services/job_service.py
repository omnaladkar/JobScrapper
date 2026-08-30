"""Job discovery, dedup and persistence. Reuses the existing scrapers."""

import sys
import time
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from config import load_companies  # noqa: E402
from scrapers import SCRAPERS  # noqa: E402
from filters import filter_jobs  # noqa: E402

from app import models  # noqa: E402
from app.services.matching import compute_match  # noqa: E402
from app.services.profile_service import get_active_profile_dict  # noqa: E402


def scrape_raw(sleep_seconds: float = 1.0):
    companies = load_companies()
    all_jobs = []
    for company in companies:
        ats = (company.get("ats") or "").lower()
        scraper_cls = SCRAPERS.get(ats)
        if not scraper_cls:
            continue
        try:
            scraper = scraper_cls(company)
            jobs = scraper.scrape()
            all_jobs.extend(jobs)
        except Exception:
            pass
        time.sleep(sleep_seconds)
    return all_jobs


def upsert_job(db: Session, raw: dict, profile: dict) -> models.Job:
    apply_url = raw.get("apply_url") or ""

    def _str(val):
        if isinstance(val, list):
            if not val:
                return ""
            return ", ".join(str(v) for v in val)
        return "" if val is None else str(val)

    job = db.query(models.Job).filter(models.Job.apply_url == apply_url).first()
    if not job:
        job = models.Job(
            company=_str(raw.get("company", "")),
            role=_str(raw.get("role", "")),
            location=_str(raw.get("location", "")),
            experience=_str(raw.get("experience", "")),
            posted_date=_str(raw.get("posted_date", "")),
            description=_str(raw.get("description", "")),
            apply_url=apply_url,
            source=_str(raw.get("source", "")),
            salary=_str(raw.get("salary", "")),
            is_manual=bool(raw.get("is_manual", False)),
        )
        db.add(job)
        db.flush()
    else:
        job.last_seen = datetime.utcnow()

    match_result = compute_match(
        {
            "role": job.role,
            "description": job.description,
            "location": job.location,
            "company": job.company,
            "experience": job.experience,
            "salary": job.salary,
        },
        profile,
    )

    if job.match:
        match = job.match
    else:
        match = models.JobMatch(job_id=job.id)
        db.add(match)

    match.score = match_result["score"]
    match.skills_score = match_result["skills_score"]
    match.experience_score = match_result["experience_score"]
    match.role_score = match_result["role_score"]
    match.location_score = match_result["location_score"]
    match.salary_score = match_result["salary_score"]
    match.company_score = match_result["company_score"]
    match.matched_skills = match_result["matched_skills"]
    match.missing_skills = match_result["missing_skills"]
    match.reasons = match_result["reasons"]
    match.recommendation = match_result["recommendation"]
    match.computed_at = datetime.utcnow()

    db.flush()
    return job


def refresh_scrape(db: Session, sleep_seconds: float = 1.0) -> int:
    """Run all scrapers, upsert jobs + matches. Returns count of new jobs."""
    profile = get_active_profile_dict(db)
    raw_jobs = scrape_raw(sleep_seconds)
    before = db.query(models.Job).count()
    for raw in raw_jobs:
        try:
            upsert_job(db, raw, profile)
        except Exception:
            continue
    db.commit()
    after = db.query(models.Job).count()
    return max(0, after - before)


def add_manual_job(db: Session, data: dict) -> models.Job:
    profile = get_active_profile_dict(db)
    raw = {
        "company": data["company"],
        "role": data["role"],
        "location": data.get("location", ""),
        "experience": data.get("experience", ""),
        "posted_date": data.get("posted_date", ""),
        "description": data.get("description", ""),
        "apply_url": data["apply_url"],
        "source": data.get("source", "manual"),
        "salary": data.get("salary", ""),
        "is_manual": True,
    }
    raw.update({"is_manual": True})
    job = upsert_job(db, raw, profile)
    db.commit()
    db.refresh(job)
    return job


def seed_from_output_files(db: Session, output_dir: str = "output") -> int:
    """Load previously-scraped jobs from output/jobs_*.json and upsert them.

    Lets a fresh DB fill up with the accumulated daily scrape results without
    re-running the (slow) scrapers. Returns number of new jobs added.
    """
    import json

    profile = get_active_profile_dict(db)
    raw_jobs = []
    output_path = Path(output_dir)
    if output_path.is_dir():
        for f in sorted(output_path.glob("jobs_*.json")):
            try:
                with open(f, encoding="utf-8") as fh:
                    data = json.load(fh)
                if isinstance(data, list):
                    raw_jobs.extend(data)
                elif isinstance(data, dict):
                    raw_jobs.extend(data.values())
            except Exception:
                pass

    before = db.query(models.Job).count()
    for raw in raw_jobs:
        if not isinstance(raw, dict) or not raw.get("apply_url"):
            continue
        # normalize any legacy match_score field away; recompute fresh
        raw = {k: v for k, v in raw.items() if k != "match_score"}
        raw.setdefault("is_manual", False)
        try:
            upsert_job(db, raw, profile)
        except Exception:
            continue
    db.commit()
    return max(0, db.query(models.Job).count() - before)


def search_jobs(db: Session, query: str = "", locations=None, limit: int = 50, min_score: float = 0.0):
    jobs = db.query(models.Job).order_by(models.Job.created_at.desc()).all()
    results = []
    q = (query or "").lower()
    locs = [l.lower() for l in (locations or [])]
    for job in jobs:
        score = job.match.score if job.match else 0
        if score < min_score:
            continue
        if q and q not in (job.role + " " + job.company).lower():
            continue
        if locs and not any(l in job.location.lower() for l in locs):
            continue
        results.append(job)
        if len(results) >= limit:
            break
    return results
