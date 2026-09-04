"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Job } from "@/lib/jobs";

export default function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-title"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 id="apply-title" className="text-xl font-semibold text-gray-900">
          Apply to {job.title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{job.company}</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
            router.push(`/jobs?q=${encodeURIComponent(job.company)}`);
          }}
        >
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Name</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">
              Why are you a good fit?{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-700"
            >
              Submit application
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}