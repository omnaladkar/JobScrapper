import { JobListSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-gray-200" />
      </div>
      <div className="h-14 mb-6 max-w-3xl animate-pulse rounded-xl border border-gray-200" />
      <div className="flex gap-8">
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl border border-gray-200" />
            <div className="h-40 animate-pulse rounded-xl border border-gray-200" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <JobListSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}