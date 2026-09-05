import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            AP
          </span>
          <span className="text-lg font-bold tracking-tight">ApplyPilot</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/jobs" className="hover:text-slate-900">
            Browse jobs
          </Link>
          <Link href="/score" className="hover:text-slate-900">
            Score a JD
          </Link>
          <Link href="/jobs" className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
            Try free
          </Link>
        </nav>
      </div>
    </header>
  );
}