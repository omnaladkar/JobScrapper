# jobsite

A modern, minimal job listings website built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**. Clean, uncluttered UI modeled loosely on the concept of JobBeeper's job search page — generous whitespace, subtle borders, and a restrained indigo accent palette.

## Overview

- **Landing page** (`/`): hero + search bar + recent openings.
- **Job search** (`/jobs`): the core page — keyword + location search that persists in the URL, a filter sidebar (job type, experience, salary, date posted, category), a paginated results list, a polished empty state, and mobile slide-over filters. Filtering is instant, client-side against a local dataset.
- **Job detail** (`/jobs/[id]`): full description, requirements, company info, an Apply modal, and similar jobs.
- **Company page** (`/companies/[slug]`): company profile with open roles.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS only (custom design, no UI kit) |
| Data | Local mock dataset (`lib/jobs.ts`, ~36 jobs) |
| Font | Inter (self-hosted via Google Fonts import) |

## Getting started

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build   # must complete with no errors
npm start       # serves the optimized build on :3000
```

## Project structure

```
web/
├─ app/
│  ├─ layout.tsx           # Root layout: header, footer, metadata
│  ├─ page.tsx             # Landing/hero page
│  ├─ globals.css          # Tailwind + Inter + base styles
│  ├─ not-found.tsx        # 404 page
│  ├─ jobs/
│  │  ├─ page.tsx          # Search + filters + pagination (server-rendered)
│  │  ├─ loading.tsx       # Skeleton loaders
│  │  └─ [id]/page.tsx     # Job detail (SSG)
│  └─ companies/[slug]/page.tsx  # Company profile (SSG)
├─ components/
│  ├─ Header.tsx / Footer.tsx
│  ├─ SearchBar.tsx        # keyword + location, URL-persisted
│  ├─ FilterSidebar.tsx    # desktop filters (URL-driven)
│  ├─ FilterDrawer.tsx     # mobile slide-over filters
│  ├─ JobCard.tsx / CompanyLogo.tsx / TypeTag.tsx
│  ├─ Pagination.tsx
│  ├─ SimilarJobs.tsx
│  ├─ ApplyButton.tsx / ApplyModal.tsx
│  └─ Skeleton.tsx         # skeleton loaders (no spinners)
└─ lib/
   ├─ jobs.ts              # Job type + mock dataset
   ├─ filters.ts           # filtering, salary format, helpers
   └─ sort.ts
```

## Data model

Each job in `lib/jobs.ts`:

```ts
{
  id, title, company, companyLogoUrl,
  location, type, salaryMin, salaryMax,
  experienceLevel, category, postedDate,
  description, requirements: string[], isRemote
}
```

## Search & filtering

- The search bar writes `?q=` and `?location=` to the URL; the sidebar writes `?type=`, `?exp=`, `?salary=`, `?posted=`, `?category=`; pagination writes `?page=`. All state is shareable via the URL.
- Filtering is computed server-side on each request against the static dataset, so the network stays fast and the page is fully SEO-renderable.
- Mobile: a `Filters` button opens a right-side slide-over drawer with the same filters.

## Accessibility

- Semantic HTML (`header`, `main`, `footer`, `fieldset`/`legend`, `nav`, `dialog`-like roles).
- Keyboard-navigable filters (native inputs), visible focus rings, `sr-only` labels.
- Contrast-conscious palette; every image/logo has an accessible fallback (initials avatar).
- Skeleton loaders (not spinners) for perceived performance.

## Deployment

Deploy to **Vercel**. The site lives in the `web/` subdirectory of the `omnaladkar/JobScrapper`
repo, so deploy from inside `web/` (treats it as the project root):

```bash
vercel login                 # once
vercel                       # preview
vercel deploy --prod --yes   # production
```

Live at **https://jobsite-psi.vercel.app**.

Alternatively, connect the GitHub repo in the Vercel dashboard and set the project's
**Root Directory** to `web` (Framework preset auto-detects Next.js). Note: `rootDirectory`
is a project setting, **not** a `vercel.json` property.

## Notes / limitations

- The site uses a local mock dataset — swap `lib/jobs.ts` for an API call later to go live with real data.
- Salary is shown as a range string (`$mink - $maxk`, or `₹` for Indian roles); `salaryMin`/`salaryMax` are stored in thousands.