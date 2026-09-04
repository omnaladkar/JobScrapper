import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-sm font-semibold text-white">
              J
            </span>
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              jobsite<span className="text-accent-600">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 sm:flex">
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Find Jobs
            </Link>
          </nav>

          <Link
            href="/jobs"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </header>
  );
}
