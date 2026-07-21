import re, json, time
from urllib.parse import urljoin
from .base import BaseScraper


class CareerPageScraper(BaseScraper):
    ATS_NAME = "careerpage"

    COMMON_SELECTORS = [
        "[class*=job-card]",
        "[class*=job-result]",
        "[class*=joblist]",
        "[class*=job-list]",
        "[class*=job_list]",
        "[class*=position-card]",
        "[class*=job] article",
        "article[class*=job]",
        "li[class*=job]",
        "tr[class*=job]",
        "[data-automation-id*=job]",
        "[class*=search-result]",
    ]

    def __init__(self, company):
        super().__init__(company)
        self.url = company.get("career_url", "")
        self.job_selector = company.get("job_selector", "")
        self.job_link_pattern = company.get("job_link_pattern", "")

    def scrape(self):
        if not self.url:
            return []
        try:
            from playwright.sync_api import sync_playwright
        except ImportError:
            print(f"  {self.company['name']}: Playwright not installed, skipping career page", flush=True)
            return []
        jobs = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                locale="en-IN",
            )
            page = context.new_page()
            try:
                page.goto(self.url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_load_state("networkidle", timeout=15000)
                time.sleep(4)

                html = page.content()
                jobs = self._extract_jsonld(html)

                if not jobs:
                    if self.job_selector:
                        jobs = self._extract_from_selector(page, self.job_selector)
                    if not jobs:
                        jobs = self._extract_from_selectors(page, self.COMMON_SELECTORS)
                    if not jobs:
                        jobs = self._extract_links(page)
            except Exception as e:
                print(f"  {self.company['name']}: ERROR - {e}", flush=True)
            finally:
                browser.close()
        return jobs

    def _extract_jsonld(self, html):
        jobs = []
        scripts = re.findall(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            html, re.DOTALL
        )
        for script in scripts:
            try:
                data = json.loads(script)
                if not isinstance(data, list):
                    data = [data]
                for item in data:
                    if isinstance(item, dict):
                        if item.get("@type") == "ItemList":
                            for el in item.get("itemListElement", []):
                                job = self._parse_ld(el)
                                if job: jobs.append(job)
                        elif item.get("@type") == "JobPosting":
                            job = self._parse_ld(item)
                            if job: jobs.append(job)
            except (json.JSONDecodeError, TypeError):
                continue
        return jobs

    def _parse_ld(self, item):
        if isinstance(item, dict) and "item" in item:
            item = item["item"]
        if not isinstance(item, dict):
            return None
        title = item.get("title", "") or item.get("name", "")
        if not title:
            return None
        location = self._ld_location(item)
        url = item.get("url", "")
        desc = self._strip_html(item.get("description", "") or "")
        date = item.get("datePosted", "") or item.get("validThrough", "")
        j = self.build_job(title, location, url, posted_date=date)
        j["description"] = desc
        j["source"] = self.ATS_NAME
        return j

    def _ld_location(self, item):
        loc = item.get("jobLocation", {}) or {}
        if isinstance(loc, list):
            parts = []
            for l in loc:
                a = (l.get("address", {}) or {}) if isinstance(l, dict) else {}
                if isinstance(a, dict):
                    parts.append(", ".join(filter(None, [
                        a.get("addressLocality", ""),
                        a.get("addressRegion", ""),
                        a.get("addressCountry", ""),
                    ])))
            return "; ".join(parts)
        if isinstance(loc, str): return loc
        if isinstance(loc, dict):
            addr = loc.get("address", {}) or {}
            if isinstance(addr, dict):
                return ", ".join(filter(None, [
                    addr.get("addressLocality", ""),
                    addr.get("addressRegion", ""),
                    addr.get("addressCountry", ""),
                ]))
            return loc.get("name", "")
        return ""

    def _extract_from_selectors(self, page, selectors):
        for sel in selectors:
            jobs = self._extract_from_selector(page, sel)
            if jobs:
                return jobs
        return []

    def _extract_from_selector(self, page, selector):
        cards = page.query_selector_all(selector)
        if len(cards) < 2:
            return []
        jobs = []
        for card in cards:
            try:
                text = card.inner_text().strip()
                if not text or len(text) < 10:
                    continue
                link = card.query_selector("a[href]")
                href = link.get_attribute("href") if link else ""
                if href and not href.startswith("http"):
                    href = urljoin(self.url, href)
                title = (card.query_selector("h2") or card.query_selector("h3") or card.query_selector("[class*=title]") or card.query_selector("a")).inner_text().strip()
                loc_el = card.query_selector("[class*=location]") or card.query_selector("[class*=loc]")
                loc = loc_el.inner_text().strip() if loc_el else ""
                j = self.build_job(title, loc, href)
                j["source"] = self.ATS_NAME
                jobs.append(j)
            except Exception:
                continue
        return jobs

    def _extract_links(self, page):
        pattern = self.job_link_pattern or r"(apply\.careers\.|careers\.|jobs\.|job|position|requisition)"
        escaped = pattern.replace("\\", "\\\\").replace("'", "\\'").replace("/", "\\/")
        js_code = f"""
        els => els.map(e => ({{href: e.href, text: e.innerText.trim().replace(/\\s+/g, ' ')}}))
                  .filter(x => x.text.length > 10 && new RegExp('{escaped}', 'i').test(x.href))
        """
        links = page.eval_on_selector_all("a[href]", js_code)
        seen = set()
        jobs = []
        for l in links:
            if l["href"] in seen: continue
            seen.add(l["href"])
            full = l["text"]
            parts = full.split("|")
            title = parts[0].strip()
            loc = ""
            if len(parts) > 1:
                loc = parts[1]
            for word in ["Posted", "New", "Days", "Hours", "Minutes", "Week", "Month", "Year", "ago"]:
                for i in range(2):
                    idx = loc.lower().find(word.lower()) if i == 0 else title.lower().find(word.lower())
                    if idx != -1:
                        if i == 0: loc = loc[:idx]
                        else: title = title[:idx]
            loc = loc.strip().strip(',').strip()
            parts = title.split(" India,", 1)
            if len(parts) > 1:
                title = parts[0].strip()
                if not loc: loc = parts[1].strip()
            elif not loc:
                city_match = re.search(
                    r"\b(Bangalore|Bengaluru|Hyderabad|Pune|Mumbai|Noida|Gurgaon|Delhi|Chennai|Kolkata)\b",
                    title, re.IGNORECASE
                )
                if city_match:
                    idx = title.lower().find(city_match.group(0).lower())
                    if idx > 0:
                        loc_match = re.search(r",\s*(.*)", title[idx:])
                        if loc_match: loc = loc_match.group(1).strip()
            title = title.strip()
            if loc and "India" not in loc:
                loc += ", India"
            jobs.append(self.build_job(title, loc, l["href"]))
        return jobs

    def _strip_html(self, html):
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()
