"""Export real scraped jobs + match scores from app.db into product/public/jobs.json.

The ApplyPilot web app reads this snapshot to list real jobs, score them
against a pasted resume, and open apply links. Re-run after a scrape:

    python scripts/export_jobs.py

Also writes product/public/jobs_freshness.json (live / added / expired deltas
vs the previous export) and updates data/last_snapshot.json as the baseline.
"""

import html
import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "app.db"
OUT = ROOT / "product" / "public" / "jobs.json"
FRESHNESS_OUT = ROOT / "product" / "public" / "jobs_freshness.json"
LAST_SNAPSHOT = ROOT / "data" / "last_snapshot.json"

QUERY = """
SELECT
    j.id, j.company, j.role, j.location, j.experience,
    j.posted_date, j.salary, j.description, j.apply_url, j.source,
    jm.score, jm.recommendation,
    jm.role_score, jm.skills_score, jm.experience_score, jm.location_score,
    jm.salary_score, jm.company_score,
    jm.matched_skills, jm.missing_skills, jm.reasons
FROM jobs j
LEFT JOIN job_matches jm ON jm.job_id = j.id
ORDER BY (jm.score IS NULL), jm.score DESC, j.id DESC
"""


def main() -> None:
    if not DB.is_file():
        print(f"DB not found: {DB}")
        sys.exit(1)

    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row

    def as_list(raw):
        if raw is None or raw == "":
            return []
        if isinstance(raw, list):
            return raw
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, list) else []
        except (TypeError, ValueError):
            return []

    def clean(text):
        return html.unescape((text or "").strip())
    jobs = []
    for row in conn.execute(QUERY):
        jobs.append({
            "id": row["id"],
            "company": clean(row["company"]),
            "role": clean(row["role"]),
            "location": clean(row["location"]),
            "experience": clean(row["experience"]),
            "posted_date": clean(row["posted_date"]),
            "salary": clean(row["salary"]),
            "description": clean(row["description"]),
            "apply_url": clean(row["apply_url"]),
            "source": clean(row["source"]),
            "score": row["score"] if row["score"] is not None else 0,
            "recommendation": row["recommendation"] or "LOW_PRIORITY",
            "role_score": row["role_score"] or 0,
            "skills_score": row["skills_score"] or 0,
            "experience_score": row["experience_score"] or 0,
            "location_score": row["location_score"] or 0,
            "salary_score": row["salary_score"] or 0,
            "company_score": row["company_score"] or 0,
            "matched_skills": as_list(row["matched_skills"]),
            "missing_skills": as_list(row["missing_skills"]),
            "reasons": as_list(row["reasons"]),
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    exported_at = datetime.now(timezone.utc).isoformat()
    payload = {"exported_at": exported_at, "jobs": jobs}
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Exported {len(jobs)} jobs -> {OUT}")

    # --- Freshness deltas vs the previous export -------------------------
    current_ids = [j["id"] for j in jobs]
    prev_jobs = []
    if LAST_SNAPSHOT.is_file():
        try:
            prev_payload = json.loads(LAST_SNAPSHOT.read_text(encoding="utf-8"))
            prev_jobs = prev_payload.get("jobs", [])
        except (ValueError, OSError):
            prev_jobs = []
    prev_ids = [j["id"] for j in prev_jobs]
    prev_at = prev_jobs[0].get("first_seen") if prev_jobs else None

    added_ids = [i for i in current_ids if i not in set(prev_ids)]
    expired_ids = [i for i in prev_ids if i not in set(current_ids)]

    freshness = {
        "exported_at": exported_at,
        "prev_exported_at": prev_at,
        "live": len(jobs),
        "added": len(added_ids),
        "expired": len(expired_ids),
        "added_jobs": added_ids[:50],
        "expired_jobs": expired_ids[:50],
        "is_first": not prev_jobs,
    }
    FRESHNESS_OUT.write_text(json.dumps(freshness), encoding="utf-8")
    print(f"Freshness: live={freshness['live']} added={freshness['added']} expired={freshness['expired']} -> {FRESHNESS_OUT}")

    LAST_SNAPSHOT.write_text(
        json.dumps({"exported_at": exported_at, "first_seen": exported_at, "jobs": jobs}),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()