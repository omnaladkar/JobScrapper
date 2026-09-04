import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!secret || !publishable) {
    return NextResponse.json({ error: "Stripe is not configured yet. Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY." }, { status: 503 });
  }

  let body: { plan?: string; customerEmail?: string; successUrl?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan || "pro";
  const priceId = process.env.STRIPE_PRICE_PRO;
  if (!priceId) {
    return NextResponse.json({ error: "STRIPE_PRICE_PRO is not set. Create a price in the Stripe dashboard." }, { status: 503 });
  }

  const origin = req.headers.get("origin") || "http://localhost:3000";
  const stripe = new Stripe(secret);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.successUrl || `${origin}/score?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      customer_email: body.customerEmail || undefined,
      metadata: { plan },
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}