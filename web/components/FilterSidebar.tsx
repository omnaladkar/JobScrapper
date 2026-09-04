"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, EXPERIENCE_LEVELS, TYPES } from "@/lib/filters";

const SALARY_OPTIONS = [
  { value: "", label: "Any salary" },
  { value: "20", label: "$20k+ / ₹20 LPA+" },
  { value: "40", label: "$40k+ / ₹40 LPA+" },
  { value: "60", label: "$60k+ / ₹60 LPA+" },
  { value: "80", label: "$80k+ / ₹80 LPA+" },
  { value: "100", label: "$100k+ / ₹1 Cr+" },
];

const POSTED_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "14", label: "Last 14 days" },
  { value: "30", label: "Last 30 days" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-gray-100 py-5 first:border-t-0 first:pt-0">
      <legend className="mb-3 block text-sm font-semibold text-gray-900">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function FilterSidebar() {
  const router = useRouter();
  const params = useSearchParams();

  function buildHref(patch: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "" ) p.delete(k);
      else p.set(k, v);
    }
    p.delete("page");
    return `/jobs?${p.toString()}`;
  }

  function toggleMulti(key: "type" | "exp", value: string) {
    const current = new URLSearchParams(params.toString()).getAll(key);
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    const obj: Record<string, string | null> = {};
    if (next.length) obj[key] = next.join(",");
    else obj[key] = null;
    router.push(buildHref(obj));
  }

  const selTypes = params.getAll("type");
  const selExp = params.getAll("exp");
  const selSalary = params.get("salary");
  const selPosted = params.get("posted");
  const selCat = params.get("category");

  return (
    <form role="search" aria-label="Job filters">
      <Section title="Job type">
        <div className="space-y-2.5">
          {TYPES.map((t) => {
            const checked = selTypes.includes(t);
            return (
              <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMulti("type", t)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <span className="capitalize">{t}</span>
                {t === "remote" && <span className="text-xs text-gray-400">(remote first)</span>}
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Experience level">
        <div className="space-y-2.5">
          {EXPERIENCE_LEVELS.map((lvl) => {
            const checked = selExp.includes(lvl);
            return (
              <label key={lvl} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleMulti("exp", lvl)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <span className="capitalize">{lvl} level</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Minimum salary">
        <select
          value={selSalary ?? ""}
          onChange={(e) => router.push(buildHref({ salary: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          {SALARY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Date posted">
        <select
          value={selPosted ?? ""}
          onChange={(e) => router.push(buildHref({ posted: e.target.value }))}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          {POSTED_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Category">
        <div className="space-y-2.5">
          {CATEGORIES.map((c) => {
            const checked = selCat === c;
            return (
              <label key={c} className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name="category"
                  checked={checked}
                  onChange={() => router.push(buildHref({ category: c }))}
                  className="h-4 w-4 border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
      </Section>
    </form>
  );
}