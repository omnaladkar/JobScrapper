import os, sys, time, smtplib, json
sys.path.insert(0, '.')
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from config import load_companies
from scrapers import SCRAPERS
from filters import filter_jobs
from storage import load_seen_jobs, deduplicate, save_new_jobs, save_seen_jobs, generate_report

MIN_SCORE = 40
companies = load_companies()
seen = load_seen_jobs()
all_jobs = []

for i, company in enumerate(companies):
    ats = company.get("ats", "").lower()
    scraper_cls = SCRAPERS.get(ats)
    if not scraper_cls:
        continue
    try:
        scraper = scraper_cls(company)
        jobs = scraper.scrape()
        all_jobs.extend(jobs)
        print(f"  [{i+1}/{len(companies)}] {company['name']}: {len(jobs)}", flush=True)
    except Exception as e:
        print(f"  [{i+1}/{len(companies)}] {company['name']}: ERROR - {e}", flush=True)
    time.sleep(2)

today_jobs = [j for j in filter_jobs(all_jobs) if j["match_score"] >= MIN_SCORE]

output_dir = os.path.join(os.path.dirname(__file__), "output")
recent_jobs = []
for d in range(1, 4):
    date = (datetime.now() - timedelta(days=d)).strftime("%Y-%m-%d")
    fpath = os.path.join(output_dir, f"jobs_{date}.json")
    if os.path.exists(fpath):
        with open(fpath) as f:
            for j in json.load(f):
                if j.get("match_score", 0) >= MIN_SCORE:
                    recent_jobs.append(j)

new_jobs = deduplicate(today_jobs + recent_jobs, seen)
save_new_jobs(new_jobs)
save_seen_jobs(seen)

report = generate_report(new_jobs, lookback_days=3)
p = f'output/report_{datetime.now().strftime("%Y-%m-%d")}.txt'
with open(p, 'w', encoding='utf-8') as f:
    f.write(report)

print(report)
print(f"\nRaw: {len(all_jobs)} | Today (score>={MIN_SCORE}): {len(today_jobs)} | Recent: {len(recent_jobs)} | New: {len(new_jobs)}", flush=True)

smtp_host = os.environ.get("SMTP_HOST")
smtp_port = os.environ.get("SMTP_PORT", "587")
smtp_user = os.environ.get("SMTP_USER")
smtp_pass = os.environ.get("SMTP_PASS")
email_to = os.environ.get("EMAIL_TO")

if smtp_pass and smtp_pass.startswith("SG."):
    try:
        import requests
        r = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {smtp_pass}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [{"to": [{"email": email_to}]}],
                "from": {"email": email_to},
                "subject": f"Job Report - {datetime.now().strftime('%Y-%m-%d')}",
                "content": [{"type": "text/plain", "value": report}],
            },
            timeout=30,
        )
        if r.status_code == 202:
            print(f"Email sent to {email_to} via SendGrid API", flush=True)
        else:
            print(f"SendGrid API error: {r.status_code} {r.text[:200]}", flush=True)
    except Exception as e:
        print(f"SendGrid API failed: {e}", flush=True)
elif smtp_host and smtp_user and smtp_pass and email_to:
    msg = MIMEText(report, _charset="utf-8")
    msg["Subject"] = f"Job Report - {datetime.now().strftime('%Y-%m-%d')}"
    msg["From"] = email_to
    msg["To"] = email_to
    for port, use_ssl in [(int(smtp_port), False), (465, True), (587, False)]:
        try:
            if use_ssl:
                with smtplib.SMTP_SSL(smtp_host, port, timeout=15) as s:
                    s.login(smtp_user, smtp_pass)
                    s.send_message(msg)
            else:
                with smtplib.SMTP(smtp_host, port, timeout=15) as s:
                    s.starttls()
                    s.login(smtp_user, smtp_pass)
                    s.send_message(msg)
            print(f"Email sent to {email_to} (port {port})", flush=True)
            break
        except Exception as e:
            print(f"  Port {port} failed: {e}", flush=True)
    else:
        print("Email NOT sent - all ports failed", flush=True)
else:
    print("Email not sent - missing SMTP config", flush=True)
