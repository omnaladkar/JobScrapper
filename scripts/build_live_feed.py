"""Build the small, fresh, daily job feed for the public site.

The scraper writes only NEW jobs to output/jobs_YYYY-MM-DD.json each day
(deduped forever by apply_url). This script:

    1. reads every output/jobs_*.json file,
    2. keeps the most-recent occurrence per apply_url,
    3. prunes anything not collected in the last FEED_AGE_DAYS (default 7),
    4. writes product/public/jobs.json (same shape export_jobs.py produces,
       but score fields are 0/empty — the product rescans jobs client-side),
    5. writes product/public/jobs_freshness.json (live / added / expired vs
       the previous feed stored in data/last_snapshot.json).

Pure stdlib so the GitHub Action can run it without extra dependencies:

    python scripts/build_live_feed.py
"""

import glob
import hashlib
import html
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "output"
OUT = ROOT / "product" / "public" / "jobs.json"
FRESHNESS_OUT = ROOT / "product" / "public" / "jobs_freshness.json"
LAST_SNAPSHOT = ROOT / "data" / "last_snapshot.json"

FEED_AGE_DAYS = int(os.environ.get("FEED_AGE_DAYS", "7"))
MAX_JOBS = int(os.environ.get("FEED_MAX_JOBS", "250"))


def stable_id(url: str) -> int:
    """Deterministic id from the apply_url so tracked applications stay stable."""
    return int(hashlib.sha256(url.encode("utf-8")).hexdigest()[:8], 16)


def clean(text: str) -> str:
    return html.unescape((text or "").strip())


def main() -> int:
    files = sorted(glob.glob(str(OUTPUT_DIR / "jobs_*.json")))
    if not files:
        print("No scraper output found — nothing to build.", file=sys.stderr)
        return 1

    collected: dict[str, tuple[datetime, dict]] = {}
    for path in files:
        try:
            date = datetime.strptime(Path(path).stem[len("jobs_"):], "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError):
            continue
        items = data if isinstance(data, list) else (
            list(data.values()) if isinstance(data, dict) else []
        )
        for raw in items:
            if not isinstance(raw, dict):
                continue
            url = raw.get("apply_url")
            if not url:
                continue
            if url not in collected or date > collected[url][0]:
                collected[url] = (date, raw)

    cutoff = datetime.now(timezone.utc) - timedelta(days=FEED_AGE_DAYS)
    jobs = []
    for url, (date, raw) in collected.items():
        if date < cutoff:
            continue
        jobs.append(
            {
                "id": stable_id(url),
                "company": clean(raw.get("company")),
                "role": clean(raw.get("role")),
                "location": clean(raw.get("location")),
                "experience": clean(raw.get("experience")),
                "posted_date": date.strftime("%Y-%m-%d"),
                "salary": clean(raw.get("salary")),
                "description": clean(raw.get("description")),
                "apply_url": url,
                "source": clean(raw.get("source")),
                "score": 0,
                "recommendation": "LOW_PRIORITY",
                "role_score": 0,
                "skills_score": 0,
                "experience_score": 0,
                "location_score": 0,
                "salary_score": 0,
                "company_score": 0,
                "matched_skills": [],
                "missing_skills": [],
                "reasons": [],
            }
        )

    jobs.sort(key=lambda j: (j["posted_date"], -j["id"]), reverse=True)
    jobs = jobs[:MAX_JOBS]

    exported_at = datetime.now(timezone.utc).isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"exported_at": exported_at, "jobs": jobs}), encoding="utf-8")

    current_ids = [j["id"] for j in jobs]
    prev_jobs = []
    if LAST_SNAPSHOT.is_file():
        try:
            prev = json.loads(LAST_SNAPSHOT.read_text(encoding="utf-8"))
            prev_jobs = prev.get("jobs", [])
        except (ValueError, OSError):
            prev_jobs = []
    prev_ids = [j["id"] for j in prev_jobs]
    prev_at = prev_jobs[0].get("posted_date") if prev_jobs else None

    added_ids = [i for i in current_ids if i not in set(prev_ids)]
    expired_ids = [i for i in prev_ids if i not in set(current_ids)]

    freshness = {
        "exported_at": exported_at,
        "prev_exported_at": prev_at,
        "live": len(jobs),
        "added": len(added_ids),
        "expired": len(expired_ids),
        "added_jobs": [str(i) for i in added_ids[:50]],
        "expired_jobs": [str(i) for i in expired_ids[:50]],
        "is_first": not prev_jobs,
    }
    FRESHNESS_OUT.write_text(json.dumps(freshness), encoding="utf-8")

    LAST_SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    LAST_SNAPSHOT.write_text(
        json.dumps({"exported_at": exported_at, "jobs": jobs}), encoding="utf-8"
    )

    print(
        f"Feed: {len(jobs)} live jobs "
        f"(brand new {freshness['added']}, expired {freshness['expired']}) "
        f"-> {OUT} (+ freshness)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())