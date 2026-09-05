"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  allApplications,
  groupedApplications,
  setApplicationStatus,
  removeApplication,
  STATUS_ORDER,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";
import { loadJobs, scoreJobForResume, type Job } from "@/lib/jobs";

const STATUS_META: Record<ApplicationStatus, { label: string; cls: string; dot: string }> = {
  APPLIED: { label: "Applied", cls: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  INTERVIEWING: { label: "Interviewing", cls: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  OFFER: { label: "Offer", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
};

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

function ApplicationRow({
  job,
  app,
  resume,
  onStatus,
  onRemove,
}: {
  job: Job;
  app: Application;
  resume: string;
  onStatus: (status: ApplicationStatus) => void;
  onRemove: () => void;
}) {
  const scored = useMemo(() => (resume ? scoreJobForResume(job, resume) : null), [job, resume]);
  const meta = STATUS_META[app.status];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{job.role}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {job.company}
            </span>
            {scored && (
              <span className={`text-xs font-bold ${scored.score >= 80 ? "text-emerald-600" : scored.score >= 55 ? "text-amber-600" : "text-rose-600"}`}>
                fit {Math.round(scored.score)}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{stripHtml(job.description) || job.location}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>{meta.label}</span>
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Open application ↗
          </a>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(Object.keys(STATUS_META) as ApplicationStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            className={
              app.status === s
                ? `rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_META[s].cls}`
                : "rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 hover:border-brand-300"
            }
          >
            {STATUS_META[s].label}
          </button>
        ))}
        <button
          onClick={onRemove}
          className="ml-auto text-[11px] font-medium text-slate-400 hover:text-rose-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [resume, setResume] = useState("");

  useEffect(() => {
    setResume(localStorage.getItem("applypilot_resume") || "");
    const refresh = () => setApps(allApplications());
    refresh();
    window.addEventListener("storage", refresh);
    loadJobs()
      .then((snap) => setJobs(snap.jobs))
      .catch(() => setJobs([]));
    return () => window.removeEventListener("storage", refresh);
  }, []);

  const jobsById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const grouped = useMemo(() => groupedApplications(apps), [apps]);
  const total = apps.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {total} tracked applications · saved only in this browser
        </p>
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          <p className="text-base font-semibold text-slate-700">Nothing tracked yet.</p>
          <p className="mt-1">
            When you click <span className="font-semibold">Apply at company ↗</span> on a job it
            shows up here automatically.
          </p>
          <Link href="/jobs" className="btn-primary mt-6">
            Browse jobs →
          </Link>
        </div>
      ) : (
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            const meta = STATUS_META[status];
            return (
              <section key={status}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold text-slate-700">
                    {meta.label}
                    <span className="ml-1.5 text-slate-400">({items.length})</span>
                  </h2>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No {meta.label.toLowerCase()} jobs
                    </p>
                  ) : (
                    items.map((app) => {
                      const job = jobsById.get(app.jobId);
                      if (!job) {
                        return (
                          <p key={app.jobId} className="text-xs text-slate-400">
                            Job #{app.jobId} is no longer in the live list
                          </p>
                        );
                      }
                      return (
                        <ApplicationRow
                          key={app.jobId}
                          job={job}
                          app={app}
                          resume={resume}
                          onStatus={(s) => {
                            setApplicationStatus(app.jobId, s);
                            setApps(allApplications());
                          }}
                          onRemove={() => {
                            removeApplication(app.jobId);
                            setApps(allApplications());
                          }}
                        />
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}