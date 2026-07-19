import os, sys, time, smtplib
sys.path.insert(0, '.')
from datetime import datetime
from email.mime.text import MIMEText
from config import load_companies
from scrapers.greenhouse import GreenhouseScraper
from filters import filter_jobs
from storage import load_seen_jobs, deduplicate, save_new_jobs, save_seen_jobs, generate_report

companies = [c for c in load_companies() if c.get("ats", "").lower() == "greenhouse"]
seen = load_seen_jobs()
all_jobs = []

for i, company in enumerate(companies):
    try:
        scraper = GreenhouseScraper(company)
        jobs = scraper.scrape()
        all_jobs.extend(jobs)
        print(f"  [{i+1}/{len(companies)}] {company['name']}: {len(jobs)}", flush=True)
    except Exception as e:
        print(f"  [{i+1}/{len(companies)}] {company['name']}: ERROR - {e}", flush=True)
    time.sleep(3)

filtered = list(filter_jobs(all_jobs))
new_jobs = deduplicate(filtered, seen)
save_new_jobs(new_jobs)
save_seen_jobs(seen)

report = generate_report(new_jobs)
p = f'output/report_{datetime.now().strftime("%Y-%m-%d")}.txt'
with open(p, 'w', encoding='utf-8') as f:
    f.write(report)

print(report)
print(f"\nRaw: {len(all_jobs)} | Filtered: {len(filtered)} | New: {len(new_jobs)}", flush=True)

smtp_host = os.environ.get("SMTP_HOST")
smtp_port = os.environ.get("SMTP_PORT", "587")
smtp_user = os.environ.get("SMTP_USER")
smtp_pass = os.environ.get("SMTP_PASS")
email_to = os.environ.get("EMAIL_TO")

if smtp_host and smtp_user and smtp_pass and email_to:
    try:
        msg = MIMEText(report, _charset="utf-8")
        msg["Subject"] = f"Job Report - {datetime.now().strftime('%Y-%m-%d')}"
        msg["From"] = smtp_user
        msg["To"] = email_to
        with smtplib.SMTP(smtp_host, int(smtp_port)) as s:
            s.starttls()
            s.login(smtp_user, smtp_pass)
            s.send_message(msg)
        print(f"Email sent to {email_to}", flush=True)
    except Exception as e:
        print(f"Email failed: {e}", flush=True)
