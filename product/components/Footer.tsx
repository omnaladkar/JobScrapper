import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row">
        <div>© {new Date().getFullYear()} ApplyPilot</div>
        <div className="flex gap-6">
          <Link href="/jobs" className="hover:text-slate-900">Browse jobs</Link>
          <Link href="/score" className="hover:text-slate-900">Score my resume</Link>
        </div>
      </div>
    </footer>
  );
}