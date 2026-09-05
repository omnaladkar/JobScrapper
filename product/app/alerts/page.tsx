"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { extractSkills } from "@/lib/jobs";
import { buildAlertSignature, newSalt, subscribeToAlerts } from "@/lib/alerts";

export default function AlertsPage() {
  const [resume, setResume] = useState("");
  const [email, setEmail] = useState("");
  const [threshold, setThreshold] = useState(60);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setResume(localStorage.getItem("applypilot_resume") || "");
  }, []);

  const skills = useMemo(() => (resume ? extractSkills(resume) : []), [resume]);

  const submit = async () => {
    setStatus("working");
    setMessage("");
    if (!resume.trim()) {
      setStatus("error");
      setMessage("Paste your resume on the Browse jobs page first — alerts use it to detect matching skills.");
      return;
    }
    if (skills.length === 0) {
      setStatus("error");
      setMessage("No recognizable tech skills detected in your resume yet.");
      return;
    }
    const salt = newSalt();
    const res = await subscribeToAlerts({
      email,
      salt,
      hashes: await buildAlertSignature(skills, salt),
      threshold,
      website,
    });
    if (res.ok) {
      setStatus("done");
      setMessage(res.message);
    } else {
      setStatus("error");
      setMessage(res.message);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link href="/jobs" className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to jobs
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">New-job email alerts</h1>
      <p className="mt-2 text-sm text-slate-500">
        Each morning, ApplyPilot checks the latest scraped jobs and emails you the new ones whose
        skills closely match yours. Detection is{" "}
        <span className="font-semibold text-slate-700">privacy-first</span> — only a salted hash of
        your skills is stored; your resume never leaves your browser and is never stored.
      </p>

      {resume.trim() && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">Your resume is loaded.</span> Detected{" "}
            <span className="font-semibold">{skills.length}</span> matching skills — the alert
            matches them against new jobs only, without ever sending them to a server.
          </p>
          {skills.length > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              Preview: {skills.slice(0, 8).join(", ")}
              {skills.length > 8 ? "…" : ""}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-sm font-semibold text-slate-700">
            <label htmlFor="threshold">Minimum match threshold</label>
            <span className="font-bold text-brand-600">{threshold}/100</span>
          </div>
          <input
            id="threshold"
            type="range"
            min={0}
            max={100}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <p className="mt-1 text-xs text-slate-400">
            Higher = fewer, higher-quality alerts. 60 means a new job must share ~60% of the skills
            it asks for.
          </p>
        </div>

        {/* honeypot — humans never see this */}
        <div className="hidden">
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {status === "done" && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {message}
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {message}
          </p>
        )}

        <button
          onClick={submit}
          disabled={status === "working"}
          className="btn-primary w-full justify-center py-2.5 disabled:opacity-50"
        >
          {status === "working" ? "Subscribing…" : "Subscribe me"}
        </button>
        <p className="text-center text-xs text-slate-400">
          One email per day, only when something new matches. Unsubscribe link in every email.
        </p>
      </div>
    </div>
  );
}