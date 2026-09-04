import Link from "next/link";
import type { Job } from "@/lib/jobs";
import { formatSalary } from "@/lib/filters";
import CompanyLogo from "./CompanyLogo";

export default function SimilarJobs({
  jobs,
  currentId,
}: {
  jobs: Job[];
  currentId: string;
}) {
  const similar = jobs.filter((j) => j.id !== currentId).slice(0, 3);
  if (similar.length === 0) return null;

  return (
    <section className="mt-16" aria-labelledby="similar-heading">
      <h2 id="similar-heading" className="text-lg font-semibold text-gray-900">
        Similar jobs
      </h2>
      <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {similar.map((j) => {
          const salary = formatSalary(j);
          return (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="group flex items-center gap-4 p-4 transition-colors hover:bg-accent-50/30"
            >
              <CompanyLogo name={j.company} src={j.companyLogoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-accent-700">
                  {j.title}
                </p>
                <p className="truncate text-sm text-gray-500">
                  {j.company} · {j.location}
                </p>
              </div>
              {salary && <span className="shrink-0 text-sm font-medium text-gray-700">{salary}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}