export function SkeletonRow({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-3">
          <span className="block h-4 w-2/5 animate-pulse rounded-md bg-gray-200" />
          <span className="block h-3 w-1/4 animate-pulse rounded-md bg-gray-200" />
          <span className="block h-3 w-3/5 animate-pulse rounded-md bg-gray-200" />
          <span className="block h-3 w-full animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}