import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JOBS } from "@/lib/jobs";
import { companyJobs, slugifyCompany } from "@/lib/filters";
import CompanyLogo from "@/components/CompanyLogo";
import JobCard from "@/components/JobCard";

interface PageProps {
  params: { slug: string };
}

function findCompanyBySlug(slug: string) {
  const job = JOBS.find((j) => slugifyCompany(j.company) === slug);
  return job ? job.company : null;
}

export function generateStaticParams() {
  const slugs = Array.from(new Set(JOBS.map((j) => slugifyCompany(j.company))));
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const company = findCompanyBySlug(params.slug);
  return company
    ? { title: `${company} — open roles`, description: `Browse open roles at ${company}.` }
    : { title: "Company not found" };
}

export default function CompanyPage({ params }: PageProps) {
  const company = findCompanyBySlug(params.slug);
  if (!company) notFound();

  const roles = companyJobs(company);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/jobs"
        className="text-sm font-medium text-gray-500 transition-colors hover:text-accent-600"
      >
        &larr; Back to all jobs
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <CompanyLogo name={company} src={null} size={56} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{company}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {roles.length} open {roles.length === 1 ? "role" : "roles"}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {roles.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}