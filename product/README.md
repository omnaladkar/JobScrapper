# ApplyPilot — know your fit before you apply

A SaaS product built on the Job Search Command Center's matching engine: paste a job
description and your resume, get an instant **0-100 fit score**, **missing skills**, and
**tailor-to-the-role tips**. It's a B2C product for job seekers.

Live: (deploy to Vercel) · Repo: `product/`

## Product thesis
- The daily-jobs-feed space is a swamp (LinkedIn/Instahyre do it free and can block
  scraping). So we flipped the wedge: **resume-job fit scoring**, a category with proven
  willingness-to-pay (Jobscan, Teal, ResumeWorded).
- **Free** = 3 scores/month (localStorage), no account. **Pro** = unlimited + apply copilot,
  $9.99/mo via Stripe.
- Scoring runs **fully in the browser** (`lib/scoreEngine.ts`) → zero server/GPU cost while
  validating demand.

## Quickstart
```bash
cd product
npm install
npm run dev          # http://localhost:3000
```

## Pages
| Route | Purpose |
|---|---|
| `/` | Landing + marketing copy |
| `/score` | Free tool: paste JD + resume → live score, gap analysis, tips |
| `/pricing` | Free vs Pro, Stripe checkout |
| `/api/checkout` | Server route → Stripe Checkout session (subscription) |

## How the score works
`lib/scoreEngine.ts` is a faithful TypeScript port of `app/services/matching.py` from the
main command-center app. Weighted dimensions (sum to 100):
role 25% · skills 30% · experience 15% · location 15% · company 10% · salary 5%.

Outputs a recommendation: `APPLY` (≥80), `CONSIDER` (≥55), `LOW_PRIORITY`. The score tool
infers experience/location/salary from the pasted JD text, so users don't fill forms.

## Going live (Stripe + Vercel)
1. Create a **Stripe** account, add a recurring price for Pro and copy its **price id**.
2. Set Vercel env vars on the deploy:
   - `STRIPE_SECRET_KEY` (server)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
   - `STRIPE_PRICE_PRO` (the Pro price id)
3. Deploy from `product/`: `vercel deploy --prod --yes` (see root `web/README.md` for the
   Vercel CLI pattern used by the sibling sites).

Until env vars are set, `/pricing` shows a graceful "not configured" message and the
free tier works standalone.

## Roadmap
- [x] Landing, score tool, pricing, free-tier limit, Stripe checkout stub
- [x] Score engine port + verified against Python engine (97 for full-fit example)
- [ ] Email capture (free tier gate) + waitlist
- [ ] Apply copilot: load your resume once, prefill forms (reuse `scripts/job-apply-prefill.user.js`)
- [ ] Auth + per-user storage of score history
- [ ] AI tailoring notes (Gemini) on Pro tier