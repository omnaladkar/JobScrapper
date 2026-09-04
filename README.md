# Job Search Command Center

Personal AI-assisted job-hunting assistant. It finds jobs (reusing the existing scrapers),
matches them against your profile/resume, helps you find people to contact, drafts messages,
and tracks your applications. You take the final LinkedIn/application action manually.

## Stack

- **Backend**: Python + FastAPI + SQLAlchemy (SQLite by default) — `app/`
- **Frontend**: React + Vite + Tailwind — `frontend/`
- **AI**: Google Gemini (free tier) via an `AIService` abstraction with a `NoopAIService` fallback
  when no `GEMINI_API_KEY` is set. ✅ No fabrication — unverified people are reported as `NOT FOUND`
  with confidence `0.0`.

## Run locally

### Dev mode (two servers, hot-reload)

```powershell
# 1. Backend (terminal 1)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8777

# 2. Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser. The Vite dev server proxies `/api` to the
backend on port 8777.

You can also run `run_local.cmd` (Windows) or `run_local.sh` (macOS/Linux).

### Production mode (one server, one port)

Build the SPA once, then FastAPI serves both the API and the static site:

```powershell
cd frontend && npm run build
cd ..
python -m uvicorn app.main:app --host 0.0.0.0 --port 8777
```

Open **http://localhost:8777**. Deep links (e.g. `/jobs/1`) are handled by the SPA router.
`run_prod.cmd` does the build + run for you.

### Docker (optional, for later deployment)

```bash
docker compose up --build
# serves the app at http://localhost:8777, SQLite persists in a named volume
```

### Prerequisites

```powershell
pip install -r api-requirements.txt
```

### Optional: enable Gemini

Set these environment variables (or put them in `app/config.py`):

```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash   # or whichever free model you want
```

Without a key, message generation uses the local template fallback (still works).

## API overview

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET/PATCH | `/api/profile` | Read / update profile & preferences |
| POST | `/api/profile/resume` | Upload PDF resume (extracts skills, etc.) |
| GET | `/api/profile/resume` | List uploaded resumes |
| GET | `/api/jobs` | List jobs (filters: `q`, `min_score`, `limit`) |
| POST | `/api/jobs` | Add a job manually |
| POST | `/api/jobs/scrape` | Run scrapers & refresh jobs |
| GET | `/api/jobs/{id}` | Job detail + match breakdown |
| POST | `/api/jobs/{id}/contacts` | Seed / check contacts for a job |
| GET | `/api/contacts/job/{job_id}` | Contacts for a job |
| POST | `/api/contacts/job/{job_id}` | Add a verified contact |
| POST/GET | `/api/contacts/{id}/message` | Generate / retrieve a message |
| POST | `/api/contacts/{id}/send` | Send a generated message by email (dry-run by default) |
| GET/POST | `/api/applications` | List / create applications |
| PATCH | `/api/applications/{id}` | Update application status/notes |
| GET | `/api/dashboard` | Stats + top matches |

## Tests

```powershell
python _api_test.py   # end-to-end path through the FastAPI TestClient
```

(Run from the project root with a fresh `data/app.db` if you want a clean run.)

## Email automation (sending messages)

The app can email a generated message to a discovered contact (e.g. a company's team-recruiting
inbox). This uses email — not LinkedIn — so there is **no account-ban risk**.

- **Safe by default**: `EMAIL_DRY_RUN=true` means nothing is ever sent until you opt in.
- The "Seed contacts" button mines the job's public posting for an email. When an email exists,
  a **Send Email** button appears next to that contact. `POST /api/contacts/{id}/send` does the work.

Configure the sender by copying `.env.example` to `.env` (or setting environment variables) and
choosing one real sender:

| Option | Steps |
|---|---|
| **Gmail App Password** (free, recommended) | Enable 2-Step Verification → create an App Password at myaccount.google.com/apppasswords → set `EMAIL_SENDER=smtp`, `SMTP_USER`, `SMTP_PASSWORD` (the app password), `EMAIL_FROM` |
| **SendGrid** (already used by the daily scraper) | Set `EMAIL_SENDER=sendgrid`, `SENDGRID_API_KEY`, and a verified `SENDGRID_FROM` |

Set `EMAIL_DRY_RUN=false` only once you've confirmed a real send works (check your sent folder).

## One-click apply (no email needed)

The dashboard's **Apply Queue** lists your top-matched jobs (score ≥ 80, not yet applied) with a
link to the real application page on the company's ATS — you open it and submit in 10 seconds.
No SMTP is required for this flow.

To auto-fill those forms with your details, install the **Tampermonkey** userscript
[`scripts/job-apply-prefill.user.js`](scripts/job-apply-prefill.user.js):

1. Install the **Tampermonkey** extension (or Violentmonkey) in Chrome.
2. Open Tampermonkey → **Create a new script** → delete the boilerplate → paste the whole
   `job-apply-prefill.user.js` file → **Save** (Ctrl+S). The extension must be **enabled** in Chrome.
3. Open any apply URL (e.g. a Greenhouse job from your queue). A small **"⚙ Set up JobApply
   prefill"** chip appears bottom-right — click it, enter your details once, **Save**.
4. From then on, every supported ATS form (Greenhouse, Lever, Workday, Instahyre, Workable,
   SmartRecruiters, Ashby…) is pre-filled automatically. Tweak anytime via the Tampermonkey menu
   → **JobApply — Edit profile**. You still click **Submit** yourself — nothing is auto-sent, and
   free-form fields (cover letter, "why are you a good fit") are left for you.

To support another ATS, add its domain under `// @match` lines and reload the script.

### Note on Apify / email-finder enrichment
Apify actors (e.g. LinkedIn Recruiter Email enrichment, Hunter.io) can be plugged in later to
**find more recruiter emails** (data enrichment only — they don't send, and don't touch your
LinkedIn account). That would expand the pool of discoverable contacts feeding the send button.

## Sources

| Source | Type | Coverage | Notes |
|---|---|---|---|
| Greenhouse | per-company board | 46 companies | `companies.json` entries with `board` |
| Ashby | per-company board | 15 companies | `board` |
| Lever | per-company board | 10 companies | `board` |
| CareerPage / Amazon | HTML / API | misc | special-cased |
| **Instahyre** | cross-company public API | all Instahyre jobs (thousands) | single `instahyre` entry pages the newest ~350 jobs; no per-company identifier needed |

Instahyre is registered in `scrapers/__init__.py` (`SCRAPERS["instahyre"]`) and wired in as one
pseudo-company entry in `companies.json`. It pages through the newest jobs and tags each with its
real employer via `employer.company_name`, populating `description` from the job's `keywords` so the
skill matcher can score them.

## Notes & limitations

- **Seeding**: on startup, if the DB is empty, the app auto-loads the accumulated job output from
  `output/jobs_*.json` (added by the daily GitHub Actions scraper). You can also click **Seed Jobs**
  on the dashboard or `POST /api/jobs/seed` any time.
- **Contact discovery (Phase 4)**: the "Seed contacts" button on a job's page mines that job's public
  posting for a real recruiter/email. Safety first — it **never touches LinkedIn or any account**, and
  never fabricates a person. When no contact is verifiable it returns `NOT FOUND` (confidence 0.0).
- The matching engine is deterministic (weighted score + recommendation), not LLM-based.
- Storage is SQLite (single-user, local tool).
