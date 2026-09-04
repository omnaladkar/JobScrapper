import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JOBS, type JobType } from "@/lib/jobs";
import { findJob, companyJobs, formatSalary, slugifyCompany, getPostedDaysAgo } from "@/lib/filters";
import CompanyLogo from "@/components/CompanyLogo";
import TypeTag from "@/components/TypeTag";
import SimilarJobs from "@/components/SimilarJobs";
import ApplyButton from "@/components/ApplyButton";

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return JOBS.map((job) => ({ id: job.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const job = findJob(params.id);
  if (!job) return { title: "Job not found" };
  return {
    title: job.title,
    description: `${job.title} at ${job.company} — ${job.location}. Find and apply on jobsite.`,
  };
}

export default function JobDetailPage({ params }: PageProps) {
  const job = findJob(params.id);
  if (!job) notFound();

  const salary = formatSalary(job);
  const companySlug = slugifyCompany(job.company);
  const similar = companyJobs(job.company);
  const postedDays = getPostedDaysAgo(job.postedDate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/jobs"
        className="text-sm font-medium text-gray-500 transition-colors hover:text-accent-600"
      >
        &larr; Back to all jobs
      </Link>

      <div className="mt-6 rounded-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CompanyLogo name={job.company} src={job.companyLogoUrl} size={56} />
          <div className="flex gap-2">
            <TypeTag type={job.type as JobType} />
            {job.isRemote && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Remote
              </span>
            )}
          </div>
        </div>

        <div className="mt-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{job.title}</h1>
          <Link
            href={`/companies/${companySlug}`}
            className="mt-1 inline-block text-base font-medium text-accent-600 hover:text-accent-700"
          >
            {job.company}
          </Link>
          <p className="mt-1 text-sm text-gray-500">{job.location}</p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-100 py-4 text-sm sm:grid-cols-3">
          {salary && (
            <div>
              <dt className="text-gray-400">Salary</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{salary}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400">Experience</dt>
            <dd className="mt-0.5 font-medium capitalize text-gray-900">{job.experienceLevel}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Posted</dt>
            <dd className="mt-0.5 font-medium text-gray-900">
              {postedDays === 0 ? "Today" : `${postedDays} days ago`}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-gray-400">Category</dt>
            <dd className="mt-0.5 font-medium text-gray-900">{job.category}</dd>
          </div>
        </dl>

        <ApplyButton job={job} />

        <section className="mt-8" aria-labelledby="description-heading">
          <h2 id="description-heading" className="text-lg font-semibold text-gray-900">
            About the role
          </h2>
          <p className="mt-3 whitespace-pre-line text-gray-600">{job.description}</p>
        </section>

        <section className="mt-8" aria-labelledby="requirements-heading">
          <h2 id="requirements-heading" className="text-lg font-semibold text-gray-900">
            Requirements
          </h2>
          <ul className="mt-3 list-inside space-y-2 text-gray-600">
            {job.requirements.map((req, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900">About {job.company}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {similar.length > 0
              ? `${job.company} has ${similar.length} open ${similar.length === 1 ? "role" : "roles"} on jobsite.`
              : "More details about this company are available on their careers site."}
          </p>
          <Link
            href={`/companies/${companySlug}`}
            className="mt-2 inline-block text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            View company profile &rarr;
          </Link>
        </section>
      </div>

      <SimilarJobs jobs={JOBS} currentId={job.id} />
    </div>
  );
}