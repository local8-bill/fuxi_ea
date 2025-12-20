import type { StageWithTimeline } from "@/lib/sequencer/collisions";
import type { StageAwareness } from "@/lib/sequencer/types";

export type StageAwarenessContext = {
  stage: StageWithTimeline;
  regionScope: string[];
  brandScope?: string[];
  channelScope?: string[];
  storeRecords?: Array<{ region: string; brand: string; country: string; stores: number }>;
};

const INVENTORY_KEYWORDS = ["inventory", "supply", "mfcs"];
const FULFILLMENT_KEYWORDS = ["fulfillment", "logistic", "delivery"];
const FINANCE_KEYWORDS = ["finance", "erp", "general ledger"];
const DATA_KEYWORDS = ["data", "integration", "api", "contract"];

export function buildStageAwareness(ctx: StageAwarenessContext): StageAwareness {
  const { stage, regionScope, storeRecords } = ctx;
  const systems = stage.systemsTouched ?? [];
  const integrations = stage.integrationsTouched ?? [];
  const domains = (stage.domainsTouched ?? []).map((domain) => domain.toLowerCase());
  const normalizedRegions = regionScope.map((code) => code.toUpperCase());

  const coupling = {
    financial: hasKeyword(domains, FINANCE_KEYWORDS),
    inventory: hasKeyword(domains, INVENTORY_KEYWORDS),
    fulfillment: hasKeyword(domains, FULFILLMENT_KEYWORDS),
    dataContract: hasKeyword(domains, DATA_KEYWORDS),
  };

  const storeFootprint = summarizeStoreFootprint(normalizedRegions, storeRecords);
  const riskFlags = buildRiskFlags({
    systems,
    integrations,
    coupling,
    storeFootprint,
  });

  return {
    blastRadius: {
      dependencyLoad: systems.length,
      criticalityWeight: stage.criticalSystems?.length ?? 0,
    },
    coupling,
    constraints: inferConstraints(stage),
    storeFootprint,
    riskFlags,
    confidence: {
      overall: resolveConfidence(stage, normalizedRegions.length > 0, integrations.length > 0),
      byField: {
        systemsTouched: systems.length ? 0.85 : 0.5,
        integrationsTouched: integrations.length ? 0.8 : 0.45,
        coupling: domains.length ? 0.75 : 0.4,
        storeFootprint: normalizedRegions.length ? 0.7 : 0.35,
      },
    },
  };
}

function hasKeyword(domains: string[], keywords: string[]): boolean {
  return domains.some((domain) => keywords.some((keyword) => domain.includes(keyword)));
}

function summarizeStoreFootprint(
  normalizedRegions: string[],
  storeRecords?: Array<{ brand: string; country: string; region: string; stores: number }>,
) {
  if (!normalizedRegions.length || !storeRecords?.length) {
    return { storesCount: 0, countriesCount: 0, brandsCount: 0 };
  }
  const storeAccumulator = {
    storesCount: 0,
    countries: new Set<string>(),
    brands: new Set<string>(),
  };
  storeRecords.forEach((record) => {
    if (normalizedRegions.includes(record.region.toUpperCase())) {
      storeAccumulator.storesCount += record.stores;
      storeAccumulator.countries.add(record.country);
      storeAccumulator.brands.add(record.brand);
    }
  });
  return {
    storesCount: storeAccumulator.storesCount,
    countriesCount: storeAccumulator.countries.size,
    brandsCount: storeAccumulator.brands.size,
  };
}

function inferConstraints(stage: StageWithTimeline) {
  const title = (stage.title ?? "").toLowerCase();
  return {
    blackout: /\bholiday|\bpeak/.test(title),
    governanceGate: /\bgate\b/.test(title),
    rfpDependency: /\brfp|procurement/.test(title),
  };
}

function buildRiskFlags({
  systems,
  integrations,
  coupling,
  storeFootprint,
}: {
  systems: string[];
  integrations: string[];
  coupling: StageAwareness["coupling"];
  storeFootprint: StageAwareness["storeFootprint"];
}) {
  const flags: string[] = [];
  if (systems.length >= 12) flags.push("high_dependency_load");
  if (integrations.length >= 20) flags.push("integration_dense");
  if (coupling.inventory) flags.push("inventory_coupling");
  if (coupling.financial) flags.push("financial_guardrail");
  if (storeFootprint.storesCount >= 250) flags.push("store_complexity");
  return flags;
}

function resolveConfidence(stage: StageWithTimeline, hasRegion: boolean, hasIntegrations: boolean) {
  let score = 0.65;
  if (stage.systemsTouched?.length) score += 0.1;
  if (hasIntegrations) score += 0.05;
  if (hasRegion) score += 0.05;
  if (stage.criticalSystems?.length) score += 0.05;
  return Math.min(0.95, score);
}
