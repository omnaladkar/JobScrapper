import Link from "next/link";

export default function Pricing() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Free, forever.</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          No plans, no paywalls, no credit card. Paste your resume and score every real job.
        </p>
      </div>

      <div className="mt-10 rounded-xl border-2 border-brand-600 p-8 text-center shadow-sm">
        <div className="mt-3 text-5xl font-extrabold text-brand-600">$0</div>
        <p className="mt-1 text-sm text-slate-500">Everything included</p>
        <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-sm text-slate-600">
          <li className="flex gap-2">
            <span className="text-brand-600">✓</span>
            <span>Score every one of 400+ real jobs against your resume</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">✓</span>
            <span>Per-job fit score with matched vs. missing skills</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">✓</span>
            <span>One-click apply links to the company&apos;s application page</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">✓</span>
            <span>Tailored resume tips for your target roles</span>
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">✓</span>
            <span>Unlimited use — no account needed</span>
          </li>
        </ul>
        <Link href="/jobs" className="btn-primary mt-8">
          Start scoring free →
        </Link>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Built to help you apply smarter. In the future we may add donations, not walled features.
      </p>
    </div>
  );
}