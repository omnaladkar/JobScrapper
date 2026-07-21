# Job Scraper

Daily job scraper that finds Java/Spring Boot backend roles in India (1-3 years experience) and emails them via SendGrid.

## How It Works

- Scrapes 28+ product/startup companies using Greenhouse ATS API + career pages (Playwright) + Amazon API
- Filters by: India cities, keywords (Java, Spring Boot, AWS, etc.), experience level, excludes senior/support/UI roles
- Scores jobs based on your tech stack match (0-100)
- Only emails jobs with score >= 40
- Includes apply URLs in the email
- Checks last 3 days for any missed jobs
- Runs daily at 2:30 AM via Railway cron

## Prerequisites

- Python 3.10+
- [Railway](https://railway.com) account (free tier works)
- [SendGrid](https://sendgrid.com) account (free: 100 emails/day)

## Quick Start

```bash
# Clone
git clone <repo> job-scraper
cd job-scraper

# Install
pip install -r requirements.txt
playwright install chromium  # only needed if scraping career pages
```

## Configuration

### Companies (`companies.json`)
List of companies to scrape. Each needs:
- `name`: Display name
- `ats`: Scraper type (`greenhouse`, `careerpage`, `amazon`)
- `board`: Greenhouse board slug (e.g. `stripe` → `boards.greenhouse.io/stripe`)
- `career_url`: Full career page URL (for `careerpage` ATS)
- `query`/`location`: Search params (for `amazon` ATS)

```json
{"name": "Stripe", "ats": "greenhouse", "board": "stripe"},
{"name": "Microsoft", "ats": "careerpage", "career_url": "https://careers.microsoft.com/...", "job_link_pattern": "apply\\.careers\\.microsoft\\.com/careers/job/"},
{"name": "Amazon", "ats": "amazon", "query": "java spring boot", "location": "India"}
```

### Filtering (`config.py`)
- `CITIES`: Target cities (Bangalore, Hyderabad, Pune, Mumbai, Noida, Chennai, Gurgaon, Delhi)
- `INCLUDE_KEYWORDS`: Title/text keywords to match (java, spring boot, sde ii, associate, etc.)
- `EXCLUDE_KEYWORDS`: Title keywords to reject (senior, support, ui, salesforce, etc.)

### Scoring (`filters.py`)
`calculate_match_score(title, location, description)`:
- Core stack (Java, Spring Boot, Backend): up to 30
- Framework keywords (AWS Lambda, SQS, Redis, Docker, etc.): 10 each
- Title bonus (Software Engineer, SDE, Java Developer): 5 each
- SDE II / Software Engineer II bonus: +10
- India location: +10, City match: +10

### Minimum Score (`run_daily.py`)
Edit `MIN_SCORE = 40` to change the threshold.

## Environment Variables

Set these on Railway (or local `.env`):

```
SENDGRID_API_KEY=SG.xxxxx
EMAIL_TO=you@gmail.com
```

The script auto-detects SendGrid API keys (starts with `SG.`) and uses the REST API (port 443). Falls back to SMTP if key doesn't start with `SG.`.

## Local Testing

```bash
python run_daily.py
```

## Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Deploy
railway up --service=just-balance
```

### Set Cron Schedule
In Railway Dashboard → Settings → Cron Schedule → paste:

```
30 2 * * *
```

This runs the scraper daily at 2:30 AM.

## Add a New Company

1. **Greenhouse**: Find the board slug from `boards.greenhouse.io/<slug>` → add to `companies.json` with `"ats": "greenhouse"`
2. **Career page**: Add URL with `"ats": "careerpage"`. The scraper tries JSON-LD first, then common selectors, then link pattern matching. Add a `job_link_pattern` regex for reliable extraction.
3. **Amazon**: Uses the Amazon Jobs JSON API directly. Add with `"ats": "amazon"`.

## Project Structure

```
├── run_daily.py          # Main pipeline: scrape → filter → email
├── config.py             # Cities, keywords, exclude lists
├── filters.py            # Location/exclude/keyword/experience matching + scoring
├── storage.py            # Seen URLs, dedup, JSON save, report generation
├── companies.json        # Company list with ATS type and config
├── scrapers/
│   ├── __init__.py       # SCRAPERS registry
│   ├── base.py           # Base scraper with build_job()
│   ├── greenhouse.py     # Greenhouse ATS scraper (requests)
│   ├── careerpage.py     # Generic career page scraper (Playwright)
│   └── amazon.py         # Amazon Jobs API scraper (requests)
├── requirements.txt      # requests, playwright
├── start.sh              # Railway entrypoint (installs Playwright, runs scraper)
└── railway.toml          # Railway service config
```
