// Client-side application tracking. Jobs live in the browser only, matching
// the "resume never leaves your machine" privacy model — no backend required.

export type ApplicationStatus = "APPLIED" | "INTERVIEWING" | "REJECTED" | "OFFER";

export interface Application {
  jobId: number;
  status: ApplicationStatus;
  updatedAt: string;
}

const KEY = "applypilot_applications";
const ORDER: ApplicationStatus[] = ["APPLIED", "INTERVIEWING", "OFFER", "REJECTED"];

export const STATUS_ORDER = ORDER;

export function allApplications(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? (raw as Application[]) : [];
  } catch {
    return [];
  }
}

export function applicationFor(jobId: number): Application | undefined {
  return allApplications().find((a) => a.jobId === jobId);
}

function save(items: Application[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function applyToJob(jobId: number): Application {
  const items = allApplications();
  const existing = items.find((a) => a.jobId === jobId);
  if (existing) return existing;
  const next: Application = { jobId, status: "APPLIED", updatedAt: new Date().toISOString() };
  save([next, ...items]);
  return next;
}

export function setApplicationStatus(jobId: number, status: ApplicationStatus): Application {
  const items = allApplications();
  const existing = items.find((a) => a.jobId === jobId);
  const next: Application = {
    jobId,
    status,
    updatedAt: new Date().toISOString(),
  };
  if (existing) {
    save(items.map((a) => (a.jobId === jobId ? next : a)));
  } else {
    save([next, ...items]);
  }
  return next;
}

export function removeApplication(jobId: number) {
  save(allApplications().filter((a) => a.jobId !== jobId));
}

export function groupedApplications(items: Application[]): Record<ApplicationStatus, Application[]> {
  return {
    APPLIED: items.filter((a) => a.status === "APPLIED"),
    INTERVIEWING: items.filter((a) => a.status === "INTERVIEWING"),
    OFFER: items.filter((a) => a.status === "OFFER"),
    REJECTED: items.filter((a) => a.status === "REJECTED"),
  };
}