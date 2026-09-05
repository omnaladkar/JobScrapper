// Server-side helpers shared by the alerts API routes (subscribe/cron/unsubscribe).

export interface Subscriber {
  email: string;
  salt: string;
  hashes: string[];
  threshold: number;
  token: string;
  createdAt: number;
}

export function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sha256Hex(text: string): string {
  const { createHash } = require("crypto") as typeof import("crypto");
  return createHash("sha256").update(text, "utf8").digest("hex");
}