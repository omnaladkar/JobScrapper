from .base import BaseScraper


class GreenhouseScraper(BaseScraper):
    ATS_NAME = "greenhouse"

    def scrape(self):
        board = self.company.get("board")
        if not board:
            return []
        url = f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true"
        resp = self.fetch(url)
        if not resp:
            return []
        try:
            data = resp.json()
        except Exception:
            return []
        if not isinstance(data, dict):
            return []
        jobs = []
        for job in data.get("jobs") or []:
            title = job.get("title", "")
            content = job.get("content", "")
            loc = job.get("offices_locations") or job.get("location", {})
            location = self._parse_location(loc)
            apply_url = job.get("absolute_url", "")
            metadata = job.get("metadata") or []
            experience = self._extract_experience(metadata)

            job_data = self.build_job(title, location, apply_url, experience=experience)
            job_data["description"] = self._strip_html(content)
            jobs.append(job_data)
        return jobs

    def _parse_location(self, loc):
        if isinstance(loc, dict):
            name = loc.get("name", "")
            if name:
                return name
            offices = loc.get("offices", [])
            if offices:
                return offices[0].get("name", "")
            return name
        if isinstance(loc, list):
            parts = []
            for item in loc:
                if isinstance(item, dict):
                    parts.append(item.get("name", ""))
                else:
                    parts.append(str(item))
            return ", ".join(filter(None, parts))
        return str(loc) if loc else ""

    def _extract_experience(self, metadata):
        for item in metadata:
            name = item.get("name", "").lower()
            if "experience" in name or "years" in name:
                return item.get("value", "")
        return ""

    def _strip_html(self, html):
        import re
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return text
