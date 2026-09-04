"use client";

import { useState } from "react";
import type { Job } from "@/lib/jobs";
import ApplyModal from "./ApplyModal";

export default function ApplyButton({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-lg bg-accent-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700 sm:w-auto"
      >
        Apply now
      </button>
      {open && <ApplyModal job={job} onClose={() => setOpen(false)} />}
    </>
  );
}