"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadJobs, scoreAllJobs, extractSkills, type Job, type ScoredJob } from "@/lib/jobs";
import { canScore, incrementScores, FREE_LIMIT } from "@/lib/usage";

const SAMPLE_RESUME = `Om Naladkar — Backend Developer
2 years of experience building backend systems.

Skills: Java, Spring Boot, Microservices, REST APIs, Kafka, Redis, PostgreSQL, MySQL, AWS, Docker, SQL, JavaScript, TypeScript`;

function recBadge(rec: string) {
  if (rec === "APPLY") return { cls: "bg-emerald-100 text-emerald-800", label: "GO AHEAD — apply" };
  if (rec === "CONSIDER") return { cls: "bg-amber-100 text-amber-700", label: "CONSIDER — tailor first" };
  return { cls: "bg-rose-100 text-rose-700", label: "LOW FIT — improve then apply" };
}

function ScorePill({ value }: { value: number }) {
  const color =
    value >= 80 ? "text-emerald-600" : value >= 55 ? "text-amber-600" : "text-rose-600";
  return <span className={`text-xl font-extrabold ${color}`}>{Math.round(value)}</span>;
}

function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
}

function JobRow({ entry, open, onToggle }: {
  entry: ScoredJob;
  open: boolean;
  onToggle: () => void;
}) {
  const badge = recBadge(entry.recommendation);
  const desc = stripHtml(entry.job.description);
  const canApply = !!entry.job.apply_url;
  const reasons = entry.reasons.slice(0, 4);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">{entry.job.role}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {entry.job.company}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {entry.job.location}
            {entry.job.salary ? ` · ${entry.job.salary}` : ""}
            {entry.job.experience ? ` · ${entry.job.experience}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-baseline gap-1">
            <ScorePill value={entry.score} />
            <span className="text-xs text-slate-400">/100</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {entry.matched_skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 font-medium text-emerald-700">You have:</span>
            {entry.matched_skills.slice(0, 8).map((s) => (
              <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                {s}
              </span>
            ))}
          </div>
        )}
        {entry.gap_skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 font-medium text-amber-700">Add to resume:</span>
            {entry.gap_skills.slice(0, 8).map((s) => (
              <span key={s} className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                + {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {reasons.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-slate-500">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="text-brand-600">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={entry.job.apply_url}
          target="_blank"
          rel="noopener noreferrer"
          className={
            canApply
              ? "btn-primary px-4 py-1.5 text-sm"
              : "pointer-events-none rounded-lg bg-slate-100 px-4 py-1.5 text-sm text-slate-400"
          }
        >
          {canApply ? "Apply at company ↗" : "No apply link yet"}
        </a>
        <button onClick={onToggle} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          {open ? "Hide job description ▲" : "View job description ▼"}
        </button>
      </div>

      {open && desc && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
          {desc}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resume, setResume] = useState("");
  const [scored, setScored] = useState<ScoredJob[] | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [limit, setLimit] = useState(25);
  const [hardBlock, setHardBlock] = useState(false);
  const [filter, setFilter] = useState<"all" | "APPLY" | "CONSIDER">("all");

  useEffect(() => {
    setResume(localStorage.getItem("applypilot_resume") || "");
    loadJobs()
      .then((snap) => setJobs(snap.jobs))
      .catch((e) => setError("Could not load jobs: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const resumeSkills = useMemo(() => (resume ? extractSkills(resume) : []), [resume]);

  const handleScore = () => {
    if (!resume.trim()) {
      setError("Paste your resume first so jobs can be scored against it.");
      return;
    }
    if (!canScore()) {
      setHardBlock(true);
      return;
    }
    setError("");
    localStorage.setItem("applypilot_resume", resume);
    incrementScores();
    setScored(scoreAllJobs(jobs, resume));
  };

  const shown = useMemo(() => {
    if (!scored) return null;
    let list = scored;
    if (filter === "APPLY") list = list.filter((s) => s.recommendation === "APPLY");
    if (filter === "CONSIDER") list = list.filter((s) => s.recommendation === "CONSIDER");
    return list.slice(0, limit);
  }, [scored, filter, limit]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Browse real jobs & score yourself</h1>
        <p className="mt-1 text-sm text-slate-500">
          {jobs.length} live jobs scraped from the job boards. Paste your resume once — every job is
          instantly scored, with the exact skills to add and a one-click apply link. Free uses left
          this month: {Math.max(0, FREE_LIMIT)}.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <label className="mb-1 block text-sm font-medium text-slate-700">Your resume</label>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={4}
          placeholder="Paste your resume here — skills, projects, anything..."
          className="input-base resize-y font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button onClick={handleScore} className="btn-primary">
            Score {jobs.length} jobs →
          </button>
          <button
            onClick={() => {
              setResume(SAMPLE_RESUME);
              setScored(null);
            }}
            className="btn-secondary"
          >
            Use example
          </button>
          {resumeSkills.length > 0 && (
            <span className="text-xs text-slate-500">
              Detected {resumeSkills.length} skills: {resumeSkills.slice(0, 6).join(", ")}
              {resumeSkills.length > 6 ? "…" : ""}
            </span>
          )}
          {error && <span className="text-sm text-rose-600">{error}</span>}
          {hardBlock && (
            <span className="text-sm text-rose-600">
              You&apos;ve used all {FREE_LIMIT} free scores this month.{" "}
              <Link href="/pricing" className="underline">
                Upgrade to Pro
              </Link>
            </span>
          )}
        </div>
      </div>

      {loading && <p className="mt-8 text-center text-sm text-slate-500">Loading jobs…</p>}

      {!loading && scored && shown && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["all", "APPLY", "CONSIDER"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    filter === f
                      ? "rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300"
                  }
                >
                  {f === "all" ? `All (${scored.length})` : `${f} (${scored.filter((s) => s.recommendation === f).length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {shown.map((entry) => (
              <JobRow
                key={entry.job.id}
                entry={entry}
                open={openId === entry.job.id}
                onToggle={() => setOpenId(openId === entry.job.id ? null : entry.job.id)}
              />
            ))}
          </div>

          {shown.length < scored.length && (
            <div className="mt-6 text-center">
              <button onClick={() => setLimit((l) => l + 25)} className="btn-secondary">
                Load more ({shown.length} / {scored.length})
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !scored && jobs.length > 0 && (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
          <p className="text-base font-semibold text-slate-700">Ready when you are.</p>
          <p className="mt-1">
            {jobs.length} real jobs are loaded. Paste your resume above and hit{" "}
            <span className="font-semibold text-slate-700">Score jobs →</span> to see your fit for
            each one, your gaps, and an apply link.
          </p>
        </div>
      )}
    </div>
  );
}