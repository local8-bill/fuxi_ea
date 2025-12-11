"use client";

import { useEffect, useMemo, useState } from "react";

export type TransformationLensOption = {
  id: string;
  label: string;
  description: string;
  domains?: string[];
  systems?: string[];
  phases?: string[];
  regions?: string[];
};

const STORAGE_KEY = "fuxi_transformation_lens";

const LENS_OPTIONS: TransformationLensOption[] = [
  {
    id: "global",
    label: "Global Lens",
    description: "Entire harmonized enterprise map.",
  },
  {
    id: "oms_program",
    label: "OMS Program",
    description: "Commerce + Finance + Order Management focus.",
    domains: ["commerce", "finance", "supply", "supply chain", "order management"],
    phases: ["fy26", "fy27"],
  },
  {
    id: "inventory_play",
    label: "Inventory Scenario",
    description: "Supply chain + FY28 composable work.",
    domains: ["supply chain"],
    regions: ["emea", "apac"],
    phases: ["fy28"],
  },
];

export function useTransformationLens() {
  const [lensId, setLensId] = useState<string>("global");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLensId(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, lensId);
  }, [lensId]);

  const activeLens = useMemo(() => LENS_OPTIONS.find((option) => option.id === lensId) ?? LENS_OPTIONS[0], [lensId]);

  return {
    lensId: activeLens.id,
    activeLens,
    lensOptions: LENS_OPTIONS,
    setLens: (id: string) => setLensId(id),
  };
}
