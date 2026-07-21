import sys, json, requests
sys.path.insert(0, '.')
from scrapers.base import BaseScraper

class AmazonScraper(BaseScraper):
    ATS_NAME = "amazon"

    def scrape(self):
        base_query = self.company.get("query", "java spring boot")
        location = self.company.get("location", "India")
        api_url = f"https://www.amazon.jobs/en/search.json?base_query={requests.utils.quote(base_query)}&location={requests.utils.quote(location)}&radius=24km"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        r = requests.get(api_url, headers=headers, timeout=30)
        data = r.json()
        jobs = []
        for j in data.get("jobs", []):
            title = j.get("title", "") or j.get("job_title", "") or ""
            if not title: continue
            loc = ", ".join(filter(None, [
                j.get("city", ""),
                j.get("state_name", "") or j.get("state", ""),
                j.get("country_code", "") or j.get("normalized_country_code", ""),
            ]))
            job_id = j.get("id", "")
            url = f"https://www.amazon.jobs/en/jobs/{job_id}" if job_id else ""
            job = self.build_job(title, loc, url)
            job["description"] = j.get("description_short", "") or j.get("description", "") or ""
            job["source"] = "amazon"
            jobs.append(job)
        return jobs

