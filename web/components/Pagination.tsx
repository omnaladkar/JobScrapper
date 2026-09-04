"use client";

import { useRouter, useSearchParams } from "next/navigation";

function PageLink({
  page,
  current,
  disabled,
  children,
}: {
  page: number;
  current: number;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const href = () => {
    const p = new URLSearchParams(params.toString());
    if (page <= 1) p.delete("page");
    else p.set("page", String(page));
    return `/jobs?${p.toString()}`;
  };

  const isCurrent = page === current;

  return (
    <button
      onClick={() => router.push(href())}
      disabled={disabled || isCurrent}
      aria-current={isCurrent ? "page" : undefined}
      className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors ${
        isCurrent
          ? "border-accent-600 bg-accent-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-accent-300 hover:text-accent-700"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

export default function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (
      p === 1 ||
      p === totalPages ||
      Math.abs(p - page) <= 1
    ) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1); // ellipsis marker
    }
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <PageLink page={page - 1} current={page} disabled={page <= 1}>
        <span className="sr-only">Previous page</span>
        &larr;
      </PageLink>

      {pages.map((p, i) =>
        p === -1 ? (
          <span key={`ellipsis-${i}`} className="px-1 text-sm text-gray-400">
            &hellip;
          </span>
        ) : (
          <PageLink key={p} page={p} current={page}>
            {p}
          </PageLink>
        )
      )}

      <PageLink page={page + 1} current={page} disabled={page >= totalPages}>
        <span className="sr-only">Next page</span>
        &rarr;
      </PageLink>
    </nav>
  );
}