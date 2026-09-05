"""Export real scraped jobs + match scores from app.db into product/public/jobs.json.

The ApplyPilot web app reads this snapshot to list real jobs, score them
against a pasted resume, and open apply links. Re-run after a scrape:

    python scripts/export_jobs.py
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
    payload = {"exported_at": datetime.now(timezone.utc).isoformat(), "jobs": jobs}
    OUT.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Exported {len(jobs)} jobs -> {OUT}")


if __name__ == "__main__":
    main()