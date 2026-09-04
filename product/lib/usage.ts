// Client-side usage limits for the free tier.

const KEY = "applypilot_scores_used";
export const FREE_LIMIT = 3;

export function scoresUsed(): number {
  if (typeof window === "undefined") return 0;
  const n = parseInt(window.localStorage.getItem(KEY) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function canScore(): boolean {
  return scoresUsed() < FREE_LIMIT;
}

export function incrementScores(): number {
  const next = scoresUsed() + 1;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, String(next));
  return next;
}

export function freeScoreRemaining(): number {
  return Math.max(0, FREE_LIMIT - scoresUsed());
}