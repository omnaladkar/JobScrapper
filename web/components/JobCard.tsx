import Link from "next/link";
import type { Job } from "@/lib/jobs";
import { formatSalary, getPostedDaysAgo } from "@/lib/filters";
import CompanyLogo from "./CompanyLogo";
import TypeTag from "./TypeTag";

function PostedLabel({ date }: { date: string }) {
  const days = getPostedDaysAgo(date);
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

export default function JobCard({ job }: { job: Job }) {
  const salary = formatSalary(job);
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-xl border border-gray-200 p-5 transition-colors hover:border-accent-300 hover:bg-accent-50/30"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo name={job.company} src={job.companyLogoUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-accent-700">
              {job.title}
            </h3>
            {job.isRemote && (
              <span className="hidden shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 sm:inline">
                Remote
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{job.company}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span>{job.location}</span>
            <span className="text-gray-300">·</span>
            <TypeTag type={job.type} />
            {salary && (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-medium text-gray-700">{salary}</span>
              </>
            )}
          </p>
          <p className="mt-3 line-clamp-2 text-sm text-gray-500">{job.description}</p>
          <p className="mt-3 text-xs text-gray-400">
            <PostedLabel date={job.postedDate} />
          </p>
        </div>
      </div>
    </Link>
  );
}