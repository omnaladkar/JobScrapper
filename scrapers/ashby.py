from .base import BaseScraper


class AshbyScraper(BaseScraper):
    ATS_NAME = "ashby"

    def scrape(self):
        board = self.company.get("board")
        if not board:
            return []
        url = f"https://api.ashbyhq.com/posting-api/job-board/{board}"
        resp = self.fetch(url)
        if not resp:
            return []
        try:
            data = resp.json()
        except Exception:
            return []
        jobs_raw = data.get("jobs") or []
        jobs = []
        for job in jobs_raw:
            title = job.get("title", "")
            location = job.get("location", "") or ""
            secondary = job.get("secondaryLocations") or []
            if secondary:
                extra = ", ".join(
                    (s.get("location") or "") for s in secondary if isinstance(s, dict)
                )
                if extra:
                    location = f"{location}, {extra}"
            apply_url = job.get("applyUrl") or job.get("jobUrl", "")
            description = job.get("descriptionHtml", "") or job.get("descriptionPlain", "")
            import re
            description = re.sub(r"<[^>]+>", " ", description)
            description = re.sub(r"\s+", " ", description).strip()

            published = job.get("publishedAt", "")

            job_data = self.build_job(title, location, apply_url)
            job_data["description"] = description
            if published:
                job_data["posted_at"] = published
            jobs.append(job_data)
        return jobs
