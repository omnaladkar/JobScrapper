import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-xs font-semibold text-white">
                J
              </span>
              <span className="font-semibold text-gray-900">
                jobsite<span className="text-accent-600">.</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              A clean jobs board for product, engineering, design, and more.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Browse</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/jobs" className="transition-colors hover:text-gray-900">
                  All jobs
                </Link>
              </li>
              <li>
                <Link href="/jobs?category=Engineering" className="transition-colors hover:text-gray-900">
                  Engineering
                </Link>
              </li>
              <li>
                <Link href="/jobs?category=Design" className="transition-colors hover:text-gray-900">
                  Design
                </Link>
              </li>
              <li>
                <Link href="/jobs?category=Data" className="transition-colors hover:text-gray-900">
                  Data
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/jobs" className="transition-colors hover:text-gray-900">
                  Post a job
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="transition-colors hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} jobsite. Built with Next.js.
        </div>
      </div>
    </footer>
  );
}
