"use client";

import { useState } from "react";
import FilterSidebar from "./FilterSidebar";

export default function FilterDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-accent-300 hover:text-accent-700 lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M7 12h10M10 18h4"
          />
        </svg>
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FilterSidebar />
            </div>
          </div>
        </div>
      )}
    </>
  );
}