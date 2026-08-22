from datetime import datetime
import re

from .base import BaseScraper


class LeverScraper(BaseScraper):
    ATS_NAME = "lever"

    def scrape(self):
        board = self.company.get("board")
        if not board:
            return []
        url = f"https://api.lever.co/v0/postings/{board}?mode=json"
        resp = self.fetch(url)
        if not resp:
            return []
        try:
            data = resp.json()
        except Exception:
            return []
        if isinstance(data, dict):
            data = data.get("jobs") or []
        jobs = []
        for job in data:
            title = job.get("text", "")
            cats = job.get("categories") or {}
            location = cats.get("location", "") or ""
            apply_url = (job.get("applyUrl")
                         or f"https://jobs.lever.co/{board}/{job.get('id', '')}")
            description = job.get("descriptionPlain", "") or ""
            lists = job.get("lists") or []
            extra_parts = []
            for item in lists:
                content = (item.get("content") or "").strip()
                if content:
                    text = re.sub(r"<[^>]+>", " ", content)
                    text = re.sub(r"\s+", " ", text).strip()
                    extra_parts.append(text)
            if extra_parts:
                description = description + " " + " ".join(extra_parts)

            created = job.get("createdAt")

            job_data = self.build_job(title, location, apply_url)
            job_data["description"] = description.strip()
            if created:
                job_data["posted_at"] = datetime.fromtimestamp(created / 1000).isoformat()
            jobs.append(job_data)
        return jobs
