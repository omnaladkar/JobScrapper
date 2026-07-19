import time
import requests


class BaseScraper:
    ATS_NAME = "base"

    def __init__(self, company):
        self.company = company
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
        })

    def fetch(self, url, retries=3):
        for attempt in range(retries):
            try:
                resp = self.session.get(url, timeout=30)
                if resp.status_code == 429:
                    wait = (attempt + 1) * 5
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                return resp
            except requests.RequestException:
                if attempt == retries - 1:
                    return None
                time.sleep(2)

    def scrape(self):
        raise NotImplementedError

    def build_job(self, title, location, url, posted_date=None, experience=None):
        return {
            "company": self.company["name"],
            "role": title,
            "location": location,
            "experience": experience or "",
            "posted_date": posted_date or "",
            "apply_url": url,
            "source": self.ATS_NAME,
            "match_score": 0,
            "description": "",
        }
