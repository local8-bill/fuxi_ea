"use client";

import { useMemo } from "react";
import storeData from "@/data/store_locations.json";

type StoreRecord = {
  region: string;
  brand: string;
  country: string;
  stores: number;
};

type RegionSummary = Record<string, { total: number; brands: Record<string, number> }>;

const records = storeData as StoreRecord[];

export function useStoreData() {
  return useMemo(() => {
    const summary: RegionSummary = {};
    records.forEach((record) => {
      if (!summary[record.region]) {
        summary[record.region] = { total: 0, brands: {} };
      }
      summary[record.region].total += record.stores;
      summary[record.region].brands[record.brand] = (summary[record.region].brands[record.brand] ?? 0) + record.stores;
    });
    return { summary, records };
  }, []);
}
