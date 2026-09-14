"use client";

import { useEffect, useState } from "react";

export default function LiveJobCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/jobs.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((snap) => {
        if (snap && Array.isArray(snap.jobs)) setCount(snap.jobs.length);
      })
      .catch(() => {});
  }, []);

  return <>{count != null ? `${count} live jobs · refreshed daily` : "live jobs refreshed daily"}</>;
}