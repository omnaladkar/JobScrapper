import sys
import time
import schedule
from datetime import datetime
from config import load_companies
from scrapers import SCRAPERS, LinkedInScraper
from filters import filter_jobs
from storage import (
    load_seen_jobs,
    save_seen_jobs,
    deduplicate,
    save_new_jobs,
    generate_report,
)


def scrape_company(company):
    ats = company.get("ats", "").lower()
    scraper_cls = SCRAPERS.get(ats)
    if not scraper_cls or scraper_cls == LinkedInScraper:
        return None
    for attempt in range(3):
        try:
            scraper = scraper_cls(company)
            jobs = scraper.scrape()
            return jobs
        except Exception as e:
            if attempt < 2:
                time.sleep(5)
                continue
            print(f"  {company['name']}: ERROR after 3 retries - {e}")
            return []
    return []


def run_once():
    print(f"[{datetime.now().isoformat()}] Starting job scrape...")
    companies = load_companies()
    seen = load_seen_jobs()
    all_jobs = []

    for company in companies:
        jobs = scrape_company(company)
        if jobs is not None:
            all_jobs.extend(jobs)
            print(f"  {company['name']}: {len(jobs)} jobs")
        time.sleep(2)

    try:
        print("  [LinkedIn] Searching... (this takes ~2 min)")
        li = LinkedInScraper()
        li_jobs = li.scrape()
        all_jobs.extend(li_jobs)
        print(f"  LinkedIn: {len(li_jobs)} jobs")
    except Exception as e:
        print(f"  LinkedIn: ERROR - {e}")

    filtered = list(filter_jobs(all_jobs))
    new_jobs = deduplicate(filtered, seen)
    save_new_jobs(new_jobs)
    save_seen_jobs(seen)

    report = generate_report(new_jobs)
    print("\n" + report)

    report_path = f"output/report_{datetime.now().strftime('%Y-%m-%d')}.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\nReport saved to {report_path}")
    print(f"\nTotal raw: {len(all_jobs)}, After filter: {len(filtered)}, New: {len(new_jobs)}")
    return new_jobs


def run_scheduled():
    print("Job scraper scheduler started. Will run at 8:00 AM IST daily.")
    schedule.every().day.at("08:00").do(run_once)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "once"
    if mode == "schedule":
        run_scheduled()
    else:
        run_once()
