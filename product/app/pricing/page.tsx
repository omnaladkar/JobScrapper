"use client";

import { useState } from "react";
import { PLANS, createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

export default function Pricing() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const upgrade = async () => {
    setMsg("");
    setBusy(true);
    try {
      if (!isStripeConfigured()) {
        setMsg("Stripe isn't connected yet — this is the launch checkout flow. Email list stays in touch when it's live.");
        return;
      }
      const { url } = await createCheckoutSession("pro", email || undefined);
      window.location.href = url;
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Simple pricing</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Score every application. Unlock unlimited scores and the apply copilot.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {/* Free */}
        <div className="rounded-xl border border-slate-200 p-8">
          <h2 className="font-semibold text-slate-900">Free</h2>
          <div className="mt-3 text-3xl font-extrabold">$0</div>
          <p className="mt-1 text-sm text-slate-500">For trying it out</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>3 fit scores / month</li>
            <li>Score breakdown (skills, experience, role, location, salary)</li>
            <li>Missing-skill gaps</li>
          </ul>
          <button className="btn-secondary mt-8 w-full" disabled>
            Current plan
          </button>
        </div>

        {/* Pro */}
        <div className="rounded-xl border-2 border-brand-600 p-8 shadow-sm">
          <h2 className="font-semibold text-slate-900">Pro</h2>
          <div className="mt-3 text-3xl font-extrabold">
            {PLANS.pro.price}
          </div>
          <p className="mt-1 text-sm text-slate-500">For serious job hunting</p>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>Unlimited fit scores</li>
            <li>Tailored resume tips per role</li>
            <li>Email capture + apply queue (early access)</li>
            <li>Cancel anytime</li>
          </ul>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com (optional)"
            className="input-base mt-8"
          />
          <button onClick={upgrade} disabled={busy} className="btn-primary mt-3 w-full">
            {busy ? "Opening checkout..." : "Get Pro — $9.99/mo"}
          </button>
          {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
        </div>
      </div>
    </div>
  );
}