import { Suspense } from "react";
import type { Metadata } from "next";
import { JOBS } from "@/lib/jobs";
import { filterJobs, parseSalary, getPostedDaysAgo } from "@/lib/filters";
import { sortByDate } from "@/lib/sort";
import JobCard from "@/components/JobCard";
import SearchBar from "@/components/SearchBar";
import FilterSidebar from "@/components/FilterSidebar";
import FilterDrawer from "@/components/FilterDrawer";
import Pagination from "@/components/Pagination";
import { JobListSkeleton } from "@/components/Skeleton";

export const metadata: Metadata = {
  title: "Search jobs",
  description:
    "Search and filter engineering, product, design, data, and marketing roles across the world.",
};

const PAGE_SIZE = 9;

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

function parseParams(searchParams: PageProps["searchParams"]) {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v ?? "";
  return {
    q: first(searchParams.q),
    location: first(searchParams.location),
    types: (Array.isArray(searchParams.type)
      ? searchParams.type
      : first(searchParams.type).split(",")
    ).filter(Boolean) as string[],
    experience: (Array.isArray(searchParams.exp)
      ? searchParams.exp
      : first(searchParams.exp).split(",")
    ).filter(Boolean) as string[],
    salary: parseSalary(first(searchParams.salary)),
    posted: first(searchParams.posted),
    category: first(searchParams.category),
    page: Math.max(1, parseInt(first(searchParams.page), 10) || 1),
  };
}

export default function JobsPage({ searchParams }: PageProps) {
  const p = parseParams(searchParams);

  const filtered = filterJobs(JOBS, {
    q: p.q,
    location: p.location,
    types: p.types as never,
    experience: p.experience,
    salaryMin: p.salary,
    postedWithin: p.posted,
    category: p.category,
  }).sort(sortByDate);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(p.page, totalPages);
  const pageJobs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount =
    (p.q ? 1 : 0) +
    (p.location ? 1 : 0) +
    p.types.length +
    p.experience.length +
    (p.salary ? 1 : 0) +
    (p.posted ? 1 : 0) +
    (p.category ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Find jobs</h1>
        <p className="mt-1 text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? "role" : "roles"} matching your criteria
        </p>
      </div>

      <Suspense fallback={<div className="h-14 animate-pulse rounded-xl border border-gray-200" />}>
        <div className="mb-6 max-w-3xl">
          <SearchBar variant="compact" />
        </div>
      </Suspense>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl border border-gray-200" />}>
            <FilterSidebar />
          </Suspense>
        </aside>

        {/* Mobile filter trigger */}
        <div className="mb-4 lg:hidden">
          <Suspense fallback={null}>
            <FilterDrawer />
          </Suspense>
        </div>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {activeFilterCount > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
            </p>
          )}

          <Suspense fallback={<JobListSkeleton count={PAGE_SIZE} />}>
            {pageJobs.length === 0 ? (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-200 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-2xl text-gray-400">
                  &#128269;
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">No jobs found</h2>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                  Try adjusting your filters, removing the location, or searching a different
                  keyword.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pageJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </Suspense>

          <Suspense fallback={null}>
            <Pagination page={page} totalPages={totalPages} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}