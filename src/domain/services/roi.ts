import fs from "node:fs/promises";
import path from "node:path";

export interface DomainROIData {
  domain: string;
  months: number[];
  cost: number[];
  benefit: number[];
  roi: number[];
  breakEvenMonth: number | null;
}

export interface ROIForecast {
  timeline: { month: number; cost: number; benefit: number; roi: number }[];
  domains: DomainROIData[];
  predictions: { breakEvenMonth: number | null };
}

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const HARMONIZED = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

async function readHarmonizedDomains(): Promise<string[]> {
  try {
    const raw = await fs.readFile(HARMONIZED, "utf8");
    const json = JSON.parse(raw);
    const counts = new Map<string, number>();
    const nodes = Array.isArray(json?.nodes) ? json.nodes : [];
    nodes.forEach((n: any) => {
      const d = (n?.domain as string | undefined)?.trim();
      if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([d]) => d);
  } catch {
    return [];
  }
}

function seedFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function buildTimeline(domain: string, months = 18): DomainROIData {
  const seed = seedFromString(domain);
  const baseCost = 120_000 + (seed % 200_000);
  const monthsArr = Array.from({ length: months }, (_, i) => i);
  const cost: number[] = [];
  const benefit: number[] = [];
  const roi: number[] = [];

  monthsArr.forEach((m) => {
    // cost tapers after midpoint
    const costVal = baseCost * (0.6 + m * 0.08 - Math.max(0, m - months / 2) * 0.04);
    const lag = 3;
    const benefitVal = m < lag ? 0 : baseCost * (0.05 * (m - lag) + 0.6);
    cost.push(Math.max(0, Math.round(costVal)));
    benefit.push(Math.max(0, Math.round(benefitVal)));
    const roiVal = costVal === 0 ? 0 : (benefitVal - costVal) / costVal;
    roi.push(Number(roiVal.toFixed(3)));
  });

  let breakEvenMonth: number | null = null;
  for (let i = 0; i < monthsArr.length; i += 1) {
    if (benefit[i] >= cost[i]) {
      breakEvenMonth = monthsArr[i];
      break;
    }
  }

  return { domain, months: monthsArr, cost, benefit, roi, breakEvenMonth };
}

export async function forecastByDomain(limit = 5): Promise<ROIForecast> {
  const domains = (await readHarmonizedDomains()).slice(0, limit);
  const fallback = ["Order Management", "Commerce", "Back Office", "Product", "Finance"];
  const domainList = domains.length ? domains.slice(0, limit) : fallback;

  const domainSeries = domainList.map((d) => buildTimeline(d));

  // Aggregate timeline by summing cost/benefit across domains (assumes same month length)
  const months = domainSeries[0]?.months ?? [];
  const aggregate = months.map((m, idx) => {
    const cost = domainSeries.reduce((sum, d) => sum + (d.cost[idx] ?? 0), 0);
    const benefit = domainSeries.reduce((sum, d) => sum + (d.benefit[idx] ?? 0), 0);
    const roi = cost === 0 ? 0 : (benefit - cost) / cost;
    return { month: m, cost, benefit, roi: Number(roi.toFixed(3)) };
  });

  let aggregateBreakEven: number | null = null;
  for (let i = 0; i < aggregate.length; i += 1) {
    if (aggregate[i].benefit >= aggregate[i].cost) {
      aggregateBreakEven = aggregate[i].month;
      break;
    }
  }

  return {
    timeline: aggregate,
    domains: domainSeries,
    predictions: { breakEvenMonth: aggregateBreakEven },
  };
}
