// Client-side privacy helpers for New-Job Email Alerts.
// Raw skills and the resume never leave the browser — we send only
// SHA-256 hashes of each skill, salted with a fresh random per-subscriber salt.

export interface SubscribePayload {
  email: string;
  salt: string;
  hashes: string[];
  threshold: number;
  website: string; // honeypot
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildAlertSignature(
  resumeSkills: string[],
  salt: string
): Promise<string[]> {
  const hashes: string[] = [];
  const seen = new Set<string>();
  for (const skill of resumeSkills) {
    const h = await sha256Hex(`${salt}:${skill}`);
    if (!seen.has(h)) {
      seen.add(h);
      hashes.push(h);
    }
  }
  return hashes;
}

export async function subscribeToAlerts(payload: SubscribePayload): Promise<{ ok: boolean; message: string }> {
  const res = await fetch("/api/alerts/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message ?? (res.ok ? "Subscribed" : "Something went wrong") };
}