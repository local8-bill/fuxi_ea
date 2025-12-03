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
  predictions: { breakEvenMonth: number | null; netROI: number | null; totalCost: number; totalBenefit: number };
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

// Stage Cost Function (from math_explainers)
function stageCostFunction(baseCost: number, dependencyLevel: number, legacyPenalty: boolean): number {
  const C_sys = baseCost;
  const C_integration = 35_000; // heuristic integration cost per dependency
  const LegacyPenalty = legacyPenalty ? 45_000 : 0;
  return C_sys + dependencyLevel * C_integration + LegacyPenalty;
}

// Cross-domain cost = sum of system-level costs (per math_explainers)
function crossDomainCostFunction(systems: number, avgDependency: number, legacyPenalty: boolean): number {
  const basePerSystem = 120_000;
  const total = stageCostFunction(basePerSystem * Math.max(0.6, systems / 10), avgDependency, legacyPenalty) * systems;
  return total;
}

function buildTimeline(domain: string, systems: number, months = 18): DomainROIData {
  const seed = seedFromString(domain);
  const dependencies = Math.max(1, Math.floor(seed % 6)); // 1-5
  const legacyPenalty = (seed % 2) === 0;
  const stageCost = crossDomainCostFunction(Math.max(1, systems), dependencies, legacyPenalty);

  // Allocate cost front-loaded (60% first half)
  const monthsArr = Array.from({ length: months }, (_, i) => i);
  const cost: number[] = [];
  const benefit: number[] = [];
  const roi: number[] = [];

  const totalCost = stageCost;
  const frontload = 0.6;
  const frontMonths = Math.max(3, Math.floor(months / 2));

  const frontCost = (totalCost * frontload) / frontMonths;
  const backCost = (totalCost * (1 - frontload)) / (months - frontMonths);

  const lag = 3;
  const adoptionRate = 0.03 + dependencies * 0.004; // slower ramp to further reduce ROI
  const benefitScalar = totalCost * 0.6; // conservative benefit potential

  monthsArr.forEach((m) => {
    const costVal = m < frontMonths ? frontCost : backCost;
    cost.push(Math.max(0, Math.round(costVal)));

    // benefit ramps after lag using simple logistic-ish growth
    const t = Math.max(0, m - lag);
    const adopt = 1 / (1 + Math.exp(-adoptionRate * (t - months / 3)));
    const benefitVal = Math.min(benefitScalar, benefitScalar * adopt);
    benefit.push(Math.max(0, Math.round(benefitVal)));

    const cumulativeCost = cost.reduce((s, v, idx) => (idx <= m ? s + v : s), 0);
    const cumulativeBenefit = benefit.reduce((s, v, idx) => (idx <= m ? s + v : s), 0);
    const roiVal = cumulativeCost === 0 ? 0 : (cumulativeBenefit - cumulativeCost) / cumulativeCost;
    roi.push(Number(roiVal.toFixed(3)));
  });

  let breakEvenMonth: number | null = null;
  for (let i = 0; i < monthsArr.length; i += 1) {
    const cc = cost.slice(0, i + 1).reduce((s, v) => s + v, 0);
    const cb = benefit.slice(0, i + 1).reduce((s, v) => s + v, 0);
    if (cb >= cc) {
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

  // Rough system counts by domain if harmonized available
  const domainCounts = new Map<string, number>();
  try {
    const raw = await fs.readFile(HARMONIZED, "utf8");
    const json = JSON.parse(raw);
    const nodes = Array.isArray(json?.nodes) ? json.nodes : [];
    nodes.forEach((n: any) => {
      const d = (n?.domain as string | undefined)?.trim() || "Other";
      domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
    });
  } catch {
    // ignore
  }

  const domainSeries = domainList.map((d) => buildTimeline(d, domainCounts.get(d) ?? 6));

  // Aggregate timeline by summing cost/benefit across domains (assumes same month length)
  const months = domainSeries[0]?.months ?? [];
  const perPeriod = months.map((m, idx) => {
    const cost = domainSeries.reduce((sum, d) => sum + (d.cost[idx] ?? 0), 0);
    const benefit = domainSeries.reduce((sum, d) => sum + (d.benefit[idx] ?? 0), 0);
    const roi = cost === 0 ? 0 : (benefit - cost) / cost;
    return { month: m, cost, benefit, roi: Number(roi.toFixed(3)) };
  });

  const aggregate: { month: number; cost: number; benefit: number; roi: number }[] = [];
  perPeriod.reduce(
    (acc, cur) => {
      const cost = acc.cost + cur.cost;
      const benefit = acc.benefit + cur.benefit;
      const roi = cost === 0 ? 0 : (benefit - cost) / cost;
      aggregate.push({ month: cur.month, cost, benefit, roi: Number(roi.toFixed(3)) });
      return { cost, benefit };
    },
    { cost: 0, benefit: 0 },
  );

  let aggregateBreakEven: number | null = null;
  let cumCost = 0;
  let cumBenefit = 0;
  for (let i = 0; i < aggregate.length; i += 1) {
    cumCost += aggregate[i].cost;
    cumBenefit += aggregate[i].benefit;
    if (aggregateBreakEven === null && cumBenefit >= cumCost) {
      aggregateBreakEven = aggregate[i].month;
    }
  }

  const totalCost = aggregate.length ? aggregate.at(-1)!.cost : 0;
  const totalBenefit = aggregate.length ? aggregate.at(-1)!.benefit : 0;
  const netROI = totalCost > 0 ? Number(((totalBenefit - totalCost) / totalCost).toFixed(3)) : null;

  return {
    timeline: aggregate,
    domains: domainSeries,
    predictions: { breakEvenMonth: aggregateBreakEven, netROI, totalCost, totalBenefit },
  };
}
