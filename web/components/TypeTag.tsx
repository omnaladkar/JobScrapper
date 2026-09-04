import type { JobType } from "@/lib/jobs";

const COLORS: Record<JobType, string> = {
  "full-time": "bg-accent-50 text-accent-700 ring-accent-200",
  "part-time": "bg-amber-50 text-amber-700 ring-amber-200",
  remote: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  contract: "bg-purple-50 text-purple-700 ring-purple-200",
};

export default function TypeTag({ type }: { type: JobType }) {
  const label = type === "full-time" ? "Full-time" : type === "part-time" ? "Part-time" : type;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLORS[type]}`}
    >
      {label}
    </span>
  );
}