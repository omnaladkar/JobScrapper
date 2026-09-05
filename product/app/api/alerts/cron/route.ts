import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { Resend } from "resend";
import { extractJobSkills } from "@/lib/jobs";
import { sha256Hex, type Subscriber } from "@/lib/alertsServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublishedJob {
  id: number;
  company: string;
  role: string;
  location: string;
  salary: string;
  apply_url: string;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const base =
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "https://product-gold-nu.vercel.app";

  const summary = {
    checkedAt: new Date().toISOString(),
    jobsTotal: 0,
    newJobs: 0,
    subscribers: 0,
    emailsSent: 0,
    matches: [] as { email: string; count: number }[],
    errors: [] as string[],
  };

  try {
    const snapRes = await fetch(`${base}/jobs.json`);
    if (!snapRes.ok) throw new Error(`jobs.json fetch failed: ${snapRes.status}`);
    const snap = (await snapRes.json()) as { exported_at: string; jobs: PublishedJob[] };
    summary.jobsTotal = snap.jobs.length;

    const seen = (await kv.get<number[]>("alerts:seenJobIds")) ?? [];
    const seenSet = new Set(seen);
    const fresh = snap.jobs.filter((j) => !seenSet.has(j.id));
    summary.newJobs = fresh.length;
    summary.checkedAt += ` (export: ${snap.exported_at})`;

    const subscribers = (await kv.get<Subscriber[]>("alerts:subscribers")) ?? [];
    summary.subscribers = subscribers.length;

    if (fresh.length > 0 && subscribers.length > 0) {
      // One pass: compute each job's skill hashes once, then match per subscriber.
      const jobsWanted = fresh
        .map((j) => ({ job: j, skills: extractJobSkills(j as never) }))
        .filter((x) => x.skills.length > 0)
        .slice(0, 200);

      const resend = new Resend(process.env.RESEND_API_KEY || "");
      const from = process.env.ALERT_FROM_EMAIL || "ApplyPilot <onboarding@resend.dev>";

      for (const sub of subscribers) {
        try {
          const hits: { job: PublishedJob; fit: number }[] = [];
          for (const { job, skills } of jobsWanted) {
            const jobHashes = skills.map((s) => sha256Hex(`${sub.salt}:${s}`));
            const matched = jobHashes.filter((h) => sub.hashes.includes(h)).length;
            if (matched === 0) continue;
            const fit = Math.round((matched / jobHashes.length) * 100);
            if (fit >= sub.threshold) hits.push({ job, fit });
          }
          if (hits.length === 0) continue;

          const rows = hits
            .slice(0, 10)
            .map(
              (h) =>
                `<li style="margin-bottom:14px">
                  <a href="${h.job.apply_url}" style="color:#0f766e;font-weight:600;text-decoration:none">${h.job.role}</a>
                  — ${h.job.company} · ${h.job.location}${h.job.salary ? ` · ${h.job.salary}` : ""}
                  <div><span style="font-size:12px;color:#64748b">skills-fit ≈ ${h.fit}/100</span></div>
                </li>`
            )
            .join("");

          const { error } = await resend.emails.send({
            from,
            to: sub.email,
            subject: `ApplyPilot: ${hits.length} new job${hits.length === 1 ? "" : "s"} for you`,
            html: `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto">
              <h1 style="font-size:18px">New matching job${hits.length === 1 ? "" : "s"} (${hits.length})</h1>
              <ul style="list-style:none;padding:0">${rows}</ul>
              <p style="font-size:12px;color:#94a3b8">Privacy: this is all we stored about you — a hash of your skills, a random salt, and a threshold. No resume, ever.</p>
              <p style="font-size:12px;color:#94a3b8">
                <a href="${base}/api/alerts/unsubscribe?token=${sub.token}" style="color:#94a3b8">Unsubscribe</a>
              </p>
            </div>`,
          });
          if (error) throw new Error(`resend: ${error.message}`);
          summary.emailsSent += 1;
          summary.matches.push({ email: sub.email, count: hits.length });
        } catch (err) {
          summary.errors.push(`${sub.email}: ${(err as Error).message}`);
        }
      }
    }

    // Always persist the seen set so nothing is re-emailed on later runs.
    fresh.forEach((j) => seenSet.add(j.id));
    await kv.set("alerts:seenJobIds", Array.from(seenSet));

    return Response.json({ ok: true, summary });
  } catch (err) {
    const message = (err as Error).message;
    console.error("alerts/cron failed", err);
    return Response.json(
      { ok: false, error: message, hint: "Set CRON_SECRET, RESEND_API_KEY, ALERT_FROM_EMAIL and link a Vercel KV store." },
      { status: 500 }
    );
  }
}