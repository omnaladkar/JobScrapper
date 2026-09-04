// Stripe checkout helper. Server-side route proxy in app/api/checkout/route.ts.

export const PLANS: Record<string, { name: string; price: string; priceId: string; description: string }> = {
  pro: {
    name: "Pro",
    price: "$9.99/mo",
    priceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    description: "Unlimited scores, apply copilot, resume notes.",
  },
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(plan: "pro", customerEmail?: string, successUrl?: string): Promise<{ url: string }> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, customerEmail, successUrl }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Checkout failed");
  }
  return res.json();
}