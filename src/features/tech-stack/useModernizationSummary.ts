"use client";

import { useEffect, useState } from "react";

const SUMMARY_KEY = "fuxi-modernization-summary";

type Summary = {
  artifacts: number;
  inventoryRows: number;
  normalizedApps: number;
};

function readSummary(): Summary {
  if (typeof window === "undefined") {
    return { artifacts: 0, inventoryRows: 0, normalizedApps: 0 };
  }
  try {
    const raw = window.localStorage.getItem(SUMMARY_KEY);
    if (!raw) return { artifacts: 0, inventoryRows: 0, normalizedApps: 0 };
    return JSON.parse(raw) as Summary;
  } catch {
    return { artifacts: 0, inventoryRows: 0, normalizedApps: 0 };
  }
}

export function useModernizationSummary() {
  const [summary, setSummary] = useState<Summary>(readSummary);

  useEffect(() => {
    const handle = () => setSummary(readSummary());
    window.addEventListener("storage", handle);
    return () => window.removeEventListener("storage", handle);
  }, []);

  return summary;
}
