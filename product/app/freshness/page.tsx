"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Freshness {
  exported_at: string;
  prev_exported_at: string | null;
  live: number;
  added: number;
  expired: number;
  added_jobs: string[];
  expired_jobs: string[];
  is_first: boolean;
}

interface Job {
  id: number;
  company: string;
  role: string;
  location: string;
  salary: string;
  apply_url: string;
}

function timeAgo(iso: string | null, now: number): string {
  if (!iso) return "never";
  const ms = now - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function JobMini({ job }: { job: Job }) {
  return (
    <li className="rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
      <a
        href={job.apply_url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-slate-800 hover:text-brand-600"
      >
        {job.role}
      </a>
      <div className="text-slate-500">
        {job.company} · {job.location}
        {job.salary ? ` · ${job.salary}` : ""}
      </div>
    </li>
  );
}

export default function FreshnessPage() {
  const [fresh, setFresh] = useState<Freshness | null>(null);
  const [jobsById, setJobsById] = useState<Map<number, Job>>(new Map());
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/jobs_freshness.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/jobs.json").then((r) => {
        if (!r.ok) throw new Error("Could not load jobs snapshot");
        return r.json();
      }),
    ])
      .then(([f, snap]) => {
        setFresh(f);
        setJobsById(new Map((snap.jobs as Job[]).map((j) => [j.id, j])));
      })
      .catch((e) => setError("Could not load freshness data: " + e.message));
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const added = (fresh?.added_jobs ?? []).map((id) => jobsById.get(Number(id))).filter(Boolean) as Job[];
  const expired = (fresh?.expired_jobs ?? []).map((id) => jobsById.get(Number(id))).filter(Boolean) as Job[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Job feed freshness</h1>
      <p className="mt-1 text-sm text-slate-500">
        Scraper status for the live job list on <Link href="/jobs" className="text-brand-600 hover:text-brand-700">Browse jobs</Link>.
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>
      )}

      {fresh && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-extrabold text-slate-900">{fresh.live || 0}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">Live jobs</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-extrabold text-emerald-600">{fresh.added || 0}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">Added last scrape</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div className="text-2xl font-extrabold text-rose-600">{fresh.expired || 0}</div>
              <div className="mt-1 text-xs font-medium text-slate-500">Removed last scrape</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
              <div
                className={`text-2xl font-extrabold ${
                  fresh.is_first ? "text-slate-400" : timeAgo(fresh.exported_at, now).startsWith("never")
                    ? "text-rose-600"
                    : "text-slate-900"
                }`}
              >
                {timeAgo(fresh.exported_at, now)}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">Last scrape</div>
            </div>
          </div>

          {fresh.is_first ? (
            <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              This is the first recorded snapshot — nothing to compare against yet. Run the scraper
              again to start seeing added/removed deltas.
            </p>
          ) : (
            <div className="mt-8 space-y-6">
              <section>
                <h2 className="text-sm font-bold text-slate-700">
                  Newly added ({fresh.added || 0})
                  {fresh.added > 0 && fresh.added > added.length
                    ? ` — showing first ${added.length}`
                    : ""}
                </h2>
                {added.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">No new jobs in this scrape.</p>
                ) : (
                  <ul className="mt-2 space-y-2">{added.map((j) => <JobMini key={j.id} job={j} />)}</ul>
                )}
              </section>
              <section>
                <h2 className="text-sm font-bold text-slate-700">
                  Removed ({fresh.expired || 0})
                  {fresh.expired > 0 && fresh.expired > expired.length
                    ? ` — showing first ${expired.length}`
                    : ""}
                </h2>
                {expired.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">Nothing removed in this scrape.</p>
                ) : (
                  <ul className="mt-2 space-y-2">{expired.map((j) => <JobMini key={j.id} job={j} />)}</ul>
                )}
              </section>
            </div>
          )}

          <p className="mt-8 text-xs leading-relaxed text-slate-400">
            The scraper stores a rolling baseline in <code>data/last_snapshot.json</code>; every
            export writes the delta to <code>product/public/jobs_freshness.json</code>. Re-run{" "}
            <code>python scripts/export_jobs.py</code> after each scrape to refresh this page.
          </p>
        </>
      )}

      {!fresh && !error && (
        <p className="mt-6 text-sm text-slate-500">
          No freshness data yet — run <code className="rounded bg-slate-100 px-1.5 py-0.5">python
          scripts/export_jobs.py</code> once to generate it.
        </p>
      )}
    </div>
  );
}