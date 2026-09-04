from .base import BaseScraper


class InstahyreScraper(BaseScraper):
    """Cross-company scraper for Instahyre's public job_search API.

    Instahyre exposes a single unauth'd JSON endpoint covering jobs from many
    companies, so no per-company identifier is needed. We page through the
    newest window and emit each job tagged with its real employer.
    """

    ATS_NAME = "instahyre"
    API = "https://www.instahyre.com/api/v1/job_search/"
    PAGE_SIZE = 35
    MAX_PAGES = 10

    def scrape(self):
        jobs = []
        for page in range(self.MAX_PAGES):
            params = {"limit": str(self.PAGE_SIZE), "offset": str(page * self.PAGE_SIZE)}
            resp = self.fetch(self._url(params))
            if not resp:
                break
            try:
                data = resp.json()
            except Exception:
                break
            objects = data.get("objects") or []
            if not objects:
                break
            for obj in objects:
                job = self._to_job(obj)
                if job:
                    jobs.append(job)
        return jobs

    def _url(self, params):
        from urllib.parse import urlencode
        return f"{self.API}?{urlencode(params)}"

    def _to_job(self, obj):
        title = obj.get("candidate_title") or obj.get("title") or ""
        if not title:
            return None
        employer = obj.get("employer") or {}
        company = employer.get("company_name") or ""
        location = obj.get("locations") or ""
        apply_url = obj.get("public_url") or ""
        keywords = obj.get("keywords") or []
        description = ", ".join(k for k in keywords if k)

        job_data = self.build_job(title, location, apply_url)
        job_data["company"] = company
        job_data["source"] = self.ATS_NAME
        job_data["description"] = description
        return job_data
