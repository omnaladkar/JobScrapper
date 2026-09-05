import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!token) {
    return new Response("Missing unsubscribe token", { status: 400 });
  }
  try {
    const all = (await kv.get<{ email: string; token: string }[]>("alerts:subscribers")) ?? [];
    const rest = all.filter((s) => s.token !== token);
    const removed = rest.length < all.length;
    await kv.set("alerts:subscribers", rest);
    return new Response(
      `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:60px auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
        <h1 style="font-size:18px">You're unsubscribed${removed ? "" : " (already done)"}.</h1>
        <p style="color:#64748b;font-size:14px">No more job alert emails from ApplyPilot. You can re-subscribe anytime from the <a href="/alerts">alerts page</a>.</p>
      </div>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("alerts/unsubscribe failed", err);
    return new Response("Unsubscribe failed — storage not configured", { status: 500 });
  }
}