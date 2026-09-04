import { JOBS, type Job, type JobType } from "./jobs";

export const TYPES: JobType[] = ["full-time", "part-time", "remote", "contract"];
export const EXPERIENCE_LEVELS = ["entry", "mid", "senior"];
export const CATEGORIES = [
  "Engineering",
  "Product",
  "Design",
  "Data",
  "Marketing",
  "Sales",
  "Finance",
  "People",
  "Support",
  "Content",
];

export interface JobFilters {
  q: string;
  location: string;
  types: JobType[];
  experience: string[];
  salaryMin: number | null;
  postedWithin: string;
  category: string;
}

export const DEFAULT_FILTERS: JobFilters = {
  q: "",
  location: "",
  types: [],
  experience: [],
  salaryMin: null,
  postedWithin: "",
  category: "",
};

export function parseSalary(value: string | null): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

export function getPostedDaysAgo(dateStr: string): number {
  const posted = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - posted) / (1000 * 60 * 60 * 24)));
}

export function filterJobs(jobs: Job[], f: JobFilters): Job[] {
  const q = f.q.trim().toLowerCase();
  const loc = f.location.trim().toLowerCase();
  const daysAgo = f.postedWithin ? parseInt(f.postedWithin, 10) : null;

  return jobs.filter((job) => {
    if (q) {
      const haystack =
        `${job.title} ${job.company} ${job.description} ${job.category} ${job.location}`.toLowerCase();
      // match all space-separated terms
      const terms = q.split(/\s+/);
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (loc) {
      if (!job.location.toLowerCase().includes(loc) && !job.isRemote) return false;
    }
    if (f.types.length > 0 && !f.types.includes(job.type)) return false;
    if (f.experience.length > 0 && !f.experience.includes(job.experienceLevel)) return false;
    if (f.category && job.category !== f.category) return false;
    if (f.salaryMin !== null && (job.salaryMax ?? 0) < f.salaryMin) return false;
    if (daysAgo !== null && getPostedDaysAgo(job.postedDate) > daysAgo) return false;
    return true;
  });
}

export function formatSalary(job: Job): string | null {
  if (job.salaryMin === null && job.salaryMax === null) return null;
  const min = job.salaryMin ?? 0;
  const max = job.salaryMax ?? min;
  const currency = job.location.toLowerCase().includes("india") ? "₹" : "$";
  return `${currency}${min}k - ${currency}${max}k`;
}

export function slugifyCompany(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getInitials(company: string): string {
  return company
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function companyJobs(company: string): Job[] {
  return JOBS.filter((j) => j.company === company);
}

export function findJob(id: string): Job | undefined {
  return JOBS.find((j) => j.id === id);
}
