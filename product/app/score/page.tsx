"use client";

import { useState } from "react";
import { computeFit, type FitResult, type ScoreInput } from "@/lib/scoreEngine";

const SAMPLE_JD = `Backend Engineer (Java) — Bangalore
We are looking for a Backend Engineer with 2-4 years of experience building scalable services.

Requirements:
- Strong Java and Spring Boot skills
- Experience with microservices architecture
- Kafka, Redis, PostgreSQL
- Exposure to AWS and Docker
- Good SQL skills
- Nice to have: Kubernetes, Go`;

const SAMPLE_RESUME = `Om Naladkar — Backend Developer
2 years of experience building backend systems.

Skills: Java, Spring Boot, Microservices, REST APIs, Kafka, Redis, PostgreSQL, MySQL, AWS, Docker, SQL, JavaScript, TypeScript`;

function recBadge(rec: string) {
  if (rec === "APPLY") return { cls: "bg-emerald-100 text-emerald-800", label: "GO AHEAD — apply" };
  if (rec === "CONSIDER") return { cls: "bg-amber-100 text-amber-700", label: "CONSIDER — tailor first" };
  return { cls: "bg-rose-100 text-rose-700", label: "LOW FIT — skip or pivot" };
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{value}/100</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ScoreTool() {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<FitResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!jd.trim() || !resume.trim()) {
      setError("Paste both a job description and your resume.");
      return;
    }

    const input: ScoreInput = {
      title: jd.split("\n")[0] || "",
      description: jd,
    };
    // Try to infer experience + location + salary from the raw text so users
    // don't have to fill forms. The engine handles missing values gracefully.
    const expMatch = jd.match(/(\d+)\s*-\s*(\d+)\s*years?/i);
    if (expMatch) input.experience = expMatch[0];
    const locMatch = jd.match(/bangalore|bengaluru|hyderabad|pune|mumbai|noida|chennai|gurgaon|ncr|remote/i);
    if (locMatch) {
      const raw = locMatch[0];
      input.location = raw.toLowerCase() === "remote" ? raw : `${raw}, India`;
    }
    const salMatch = jd.match(/(\d+(?:\.\d+)?)\s*lpa/i);
    if (salMatch) input.salary = salMatch[0] + " lpa";

    setResult(computeFit(input));
  };

  const fillExample = () => {
    setJd(SAMPLE_JD);
    setResume(SAMPLE_RESUME);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Score my resume</h1>
        <p className="mt-1 text-sm text-slate-500">
          Paste a job description and your resume. Instant fit score, missing skills, and tips. Free,
          forever.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={7}
              placeholder="Paste the full job description here..."
              className="input-base resize-y font-mono text-xs"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Your resume</label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              rows={7}
              placeholder="Paste your resume (or key skills) here..."
              className="input-base resize-y font-mono text-xs"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1 sm:flex-none">
              Score fit →
            </button>
            <button type="button" onClick={fillExample} className="btn-secondary">
              Use example
            </button>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </form>

        <div>
          {!result ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              Your fit score and gap analysis will show up here.
              <div className="mt-4">
                <button onClick={fillExample} className="text-brand-600 underline hover:text-brand-700">
                  Try it with the example data
                </button>
              </div>
            </div>
          ) : (
            <ResultCard result={result} />
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: FitResult }) {
  const badge = recBadge(result.recommendation);
  return (
    <div className="rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Fit score</div>
          <div className="text-5xl font-extrabold text-slate-900">{result.score}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Bar label="Skills" value={result.skills_score} />
        <Bar label="Experience" value={result.experience_score} />
        <Bar label="Role / title" value={result.role_score} />
        <Bar label="Location" value={result.location_score} />
        <Bar label="Salary" value={result.salary_score} />
      </div>

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Why it scored this way</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          {result.reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-600">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>

        {result.matched_skills.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-emerald-700">Matched skills</h3>
            <div className="flex flex-wrap gap-2">
              {result.matched_skills.map((s) => (
                <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.missing_skills.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-amber-700">Gap — add to your resume</h3>
            <div className="flex flex-wrap gap-2">
              {result.missing_skills.map((s) => (
                <span key={s} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  + {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Tailoring tip: mention these skills in your resume&apos;s skills line and a project if
              you&apos;ve used them — even briefly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}