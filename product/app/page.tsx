import Link from "next/link";

const FEATURES = [
  {
    title: "Instant fit score",
    body: "Paste any job description, get a 0–100 compatibility score in seconds against your real skills.",
  },
  {
    title: "Missing skills radar",
    body: "See exactly which in-demand skills are missing so you can close the gap or tailor your resume.",
  },
  {
    title: "Tailor before you apply",
    body: "Actionable suggestions to tweak your resume for that specific role — no generic advice.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center">
        <p className="mb-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          Get a score before you apply
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          Apply to jobs you&apos;re <span className="text-brand-600">actually fit for</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Paste a job description and your resume. ApplyPilot scores your fit, surfaces missing
          skills, and tells you exactly what to fix before you hit submit.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/score" className="btn-primary">
            Score my resume — free
          </Link>
          <Link href="/pricing" className="btn-secondary">
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">Free: 3 scores/month · no account needed</p>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", label: "Paste", body: "Drop in the job description and your resume." },
              { n: "2", label: "Score", body: "Get your 0–100 fit score with a full breakdown." },
              { n: "3", label: "Apply", body: "Fix the gaps, then apply with confidence." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.label}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Why candidates waste time applying wrong
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}