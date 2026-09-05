import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { randomToken, type Subscriber } from "@/lib/alertsServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ ok: false, message: "Bad request" }, { status: 400 });

    // Honeypot — silent success so bots can't tell they were caught.
    if (body.website) return Response.json({ ok: true, message: "Subscribed" });

    const email = String(body.email || "").trim().toLowerCase();
    const salt = String(body.salt || "");
    const hashes = Array.isArray(body.hashes) ? body.hashes.map(String).filter(Boolean) : [];
    const threshold = Math.min(Math.max(Number(body.threshold) || 60, 0), 100);

    if (!EMAIL_RE.test(email) || !salt || hashes.length === 0) {
      return Response.json({ ok: false, message: "Invalid subscription" }, { status: 400 });
    }
    if (hashes.length > 200) {
      return Response.json({ ok: false, message: "Too many skills" }, { status: 400 });
    }

    const all = (await kv.get<Subscriber[]>("alerts:subscribers")) ?? [];
    const existing = all.find((s) => s.email === email);
    const next: Subscriber = {
      email,
      salt,
      hashes,
      threshold,
      token: existing?.token ?? randomToken(),
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await kv.set("alerts:subscribers", [next, ...all.filter((s) => s.email !== email)]);

    return Response.json({ ok: true, message: "You're subscribed. Alerts will be sent once a day when new matching jobs appear." });
  } catch (err) {
    console.error("alerts/subscribe failed", err);
    return Response.json(
      { ok: false, message: "Subscription storage is not configured yet (Vercel KV)." },
      { status: 500 }
    );
  }
}