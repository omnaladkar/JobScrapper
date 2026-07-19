import json
import os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "seen_jobs.json")


def load_seen_jobs():
    if not os.path.exists(DATA_FILE):
        return set()
    with open(DATA_FILE, encoding="utf-8") as f:
        try:
            data = json.load(f)
            return set(data.get("seen_urls", []))
        except (json.JSONDecodeError, KeyError):
            return set()


def save_seen_jobs(seen_urls):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"seen_urls": list(seen_urls)}, f, indent=2)


def deduplicate(jobs, seen_urls):
    new_jobs = []
    for job in jobs:
        url = job.get("apply_url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            new_jobs.append(job)
    return new_jobs


def save_new_jobs(jobs):
    if not jobs:
        return
    date_str = datetime.now().strftime("%Y-%m-%d")
    output_dir = os.path.join(os.path.dirname(__file__), "output")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, f"jobs_{date_str}.json")
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)


def generate_report(jobs):
    if not jobs:
        return "No new jobs found today."
    lines = [f"# Daily Job Report - {datetime.now().strftime('%Y-%m-%d')}", ""]
    lines.append(f"Total new jobs found: {len(jobs)}")
    lines.append(f"{'Company':25} {'Role':50} {'Location':20} {'Match Score':10}")
    lines.append("-" * 105)
    for job in sorted(jobs, key=lambda x: x["match_score"], reverse=True):
        lines.append(
            f"{job['company'][:24]:25} "
            f"{job['role'][:49]:50} "
            f"{job['location'][:19]:20} "
            f"{job['match_score']:>3}/100"
        )
    lines.append("")
    lines.append(f"Generated at: {datetime.now().isoformat()}")
    return "\n".join(lines)
