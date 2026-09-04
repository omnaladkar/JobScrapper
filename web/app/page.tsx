import Link from "next/link";
import { Suspense } from "react";
import SearchBar from "@/components/SearchBar";
import JobCard from "@/components/JobCard";
import { JOBS } from "@/lib/jobs";
import { sortByDate } from "@/lib/sort";

export default function HomePage() {
  const recent = [...JOBS].sort(sortByDate).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700">
            {JOBS.length} open roles · worldwide
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Find work that{" "}
            <span className="text-accent-600">actually fits.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            A clean, focused job board for engineering, product, design, and
            data roles — with none of the noise.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <Suspense
              fallback={
                <div className="h-14 animate-pulse rounded-xl border border-gray-200" />
              }
            >
              <SearchBar variant="hero" />
            </Suspense>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
            <Link
              href="/jobs"
              className="font-medium text-accent-600 hover:text-accent-700"
            >
              Browse all jobs &rarr;
            </Link>
            <span className="text-gray-300">·</span>
            <span>Popular: Engineering · Remote · Data</span>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="recent-heading">
        <div className="mb-6 flex items-center justify-between">
          <h2 id="recent-heading" className="text-xl font-semibold text-gray-900">
            Recent openings
          </h2>
          <Link
            href="/jobs"
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </div>
  );
}