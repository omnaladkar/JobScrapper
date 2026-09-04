"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  variant = "hero",
}: {
  variant?: "hero" | "compact";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params.toString());
    if (q.trim()) p.set("q", q.trim());
    else p.delete("q");
    if (location.trim()) p.set("location", location.trim());
    else p.delete("location");
    router.push(`/jobs?${p.toString()}`);
  }

  const inputBase =
    "w-full border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none";

  return (
    <form
      onSubmit={onSubmit}
      className={`grid w-full gap-3 rounded-xl border border-gray-200 bg-white p-2 sm:grid-cols-[1fr_1fr_auto] ${
        variant === "hero"
          ? "shadow-sm sm:p-3"
          : ""
      }`}
    >
      <label className="relative block">
        <span className="sr-only">Job title or keyword</span>
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Job title, keyword, or company"
          className={inputBase}
        />
      </label>

      <label className="relative block">
        <span className="sr-only">Location</span>
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City or 'Remote'"
          className={inputBase}
        />
      </label>

      <button
        type="submit"
        className="rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
      >
        Search
      </button>
    </form>
  );
}