import { forecastByDomain, type ROIForecast } from "@/domain/services/roi";

export type SpendBucket = {
  label: string;
  cost: number;
  benefit: number;
};

export type FteTimelineEntry = {
  label: string;
  fte: number;
  note: string;
};

export type ReplacementRow = {
  name: string;
  breakEven: string;
  savings: string;
};

export type FinancialsViewModel = ROIForecast & {
  spendBuckets: SpendBucket[];
  fteTimeline: FteTimelineEntry[];
  replacementTimeline: ReplacementRow[];
};

export async function buildFinancialForecast(projectId?: string): Promise<FinancialsViewModel> {
  // TODO: use projectId-specific sequences once ingestion wiring lands.
  const base = await forecastByDomain(5);
  return enrichForecast(base);
}

export function enrichForecast(base: ROIForecast): FinancialsViewModel {
  const spendBuckets = bucketTimeline(base.timeline);
  const fteTimeline = estimateFteTimeline(spendBuckets);
  const replacementTimeline = buildReplacementTimeline(base.domains);
  return { ...base, spendBuckets, fteTimeline, replacementTimeline };
}

function bucketTimeline(timeline: ROIForecast["timeline"]): SpendBucket[] {
  if (!timeline?.length) return [];
  const bucketMap = new Map<number, SpendBucket>();
  timeline.forEach((entry) => {
    const yearIndex = Math.floor((entry.month ?? 0) / 12);
    const label = `FY${String(new Date().getFullYear() + yearIndex).slice(-2)}`;
    const current = bucketMap.get(yearIndex) ?? { label, cost: 0, benefit: 0 };
    current.cost += entry.cost ?? 0;
    current.benefit += entry.benefit ?? 0;
    bucketMap.set(yearIndex, current);
  });
  return Array.from(bucketMap.values());
}

function estimateFteTimeline(buckets: SpendBucket[]): FteTimelineEntry[] {
  if (!buckets.length) return [];
  const averageLoadedCost = 220_000;
  return buckets.map((bucket) => ({
    label: bucket.label,
    fte: Math.max(0, Math.round(((bucket.cost * 0.35) / averageLoadedCost) * 12)),
    note: "Assumes 35% staffing mix · heuristic",
  }));
}

function buildReplacementTimeline(domains: ROIForecast["domains"]): ReplacementRow[] {
  if (!domains?.length) return [];
  return domains.map((domain) => {
    const savings = domain.benefit?.length
      ? formatCurrency(domain.benefit.reduce((sum, value) => sum + value, 0) / 12)
      : "Needs input";
    return {
      name: domain.domain,
      breakEven: domain.breakEvenMonth != null ? `Month ${domain.breakEvenMonth}` : "Pending",
      savings,
    };
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}
