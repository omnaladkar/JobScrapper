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
| GET/POST | `/api/applications` | List / create applications |
| PATCH | `/api/applications/{id}` | Update application status/notes |
| GET | `/api/dashboard` | Stats + top matches |

## Tests

```powershell
python _api_test.py   # end-to-end path through the FastAPI TestClient
```

(Run from the project root with a fresh `data/app.db` if you want a clean run.)

## Notes & limitations (Phase 1)

- Contact finding is **rule-based / best-effort** and reports `NOT FOUND` with confidence `0.0`
  rather than fabricating details. Verified real contacts must be added manually for now.
  LLM-based people discovery is a later phase.
- Resume parsing is rule-based (regex over extracted PDF text). It's good enough for skills/name;
  section boundaries can over-capture on unusual formats.
- Storage is SQLite (single-user, local tool) rather than PostgreSQL/Redis from the original spec.
- The matching engine is deterministic (weighted score + recommendation), not LLM-based.
