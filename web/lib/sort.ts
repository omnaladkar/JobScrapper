import type { Job } from "./jobs";

export function sortByDate(a: Job, b: Job): number {
  return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
}