import { loadValidated } from "./loaders";
import {
  AIInsight,
  Capability,
  Domain,
  Event,
  Integration,
  KPI,
  ROIResult,
  System,
  RiskEntity,
  AIRecommendationSet,
  DataSourceRegistry,
} from "./entities";

type DatasetName =
  | "systems"
  | "integrations"
  | "domains"
  | "capabilities"
  | "roi"
  | "ai"
  | "events"
  | "kpis"
  | "risk"
  | "aiRecommendations"
  | "dataSources";

type Summary = {
  name: DatasetName;
  count: number;
  errors: string[];
  warnings: string[];
};

function duplicateWarnings<T extends { id?: string }>(items: T[], label: string): string[] {
  const seen = new Map<string, number>();
  const warnings: string[] = [];
  items.forEach((item, idx) => {
    const id = item.id ?? "";
    if (!id) return;
    if (seen.has(id)) {
      warnings.push(`${label} duplicate id "${id}" at index ${idx}`);
    } else {
      seen.set(id, 1);
    }
  });
  return warnings;
}

function freshnessWarnings<T extends { lastUpdated?: string; source?: string }>(
  items: T[],
  label: string
): string[] {
  const warnings: string[] = [];
  items.forEach((item, idx) => {
    if (!item.lastUpdated) warnings.push(`${label} index ${idx} missing lastUpdated`);
    if (!item.source) warnings.push(`${label} index ${idx} missing source`);
  });
  return warnings;
}

function timestampQualityWarnings<T extends { lastUpdated?: string }>(items: T[], label: string): string[] {
  const warnings: string[] = [];
  let lastTime: number | null = null;
  items.forEach((item, idx) => {
    if (!item.lastUpdated) return;
    const ts = Date.parse(item.lastUpdated);
    if (Number.isNaN(ts)) {
      warnings.push(`${label} index ${idx} has invalid lastUpdated format`);
      return;
    }
    if (lastTime != null && ts < lastTime) {
      warnings.push(`${label} index ${idx} lastUpdated regresses (potential overwrite)`);
    }
    lastTime = ts;
  });
  return warnings;
}

export async function validateAll(): Promise<Summary[]> {
  const results: Summary[] = [];

  const push = (name: DatasetName, count: number, errors: string[], warnings: string[]) => {
    results.push({ name, count, errors, warnings });
  };

  const systemsRes = await loadValidated<System>("systems");
  push(
    "systems",
    systemsRes.data.length,
    systemsRes.errors,
    [
      ...duplicateWarnings(systemsRes.data, "system"),
      ...freshnessWarnings(systemsRes.data, "system"),
      ...timestampQualityWarnings(systemsRes.data, "system"),
    ]
  );

  const integrationsRes = await loadValidated<Integration>("integrations");
  push(
    "integrations",
    integrationsRes.data.length,
    integrationsRes.errors,
    [
      ...duplicateWarnings(integrationsRes.data, "integration"),
      ...freshnessWarnings(integrationsRes.data, "integration"),
      ...timestampQualityWarnings(integrationsRes.data, "integration"),
    ]
  );

  const domainsRes = await loadValidated<Domain>("domains");
  push(
    "domains",
    domainsRes.data.length,
    domainsRes.errors,
    [
      ...duplicateWarnings(domainsRes.data, "domain"),
      ...freshnessWarnings(domainsRes.data, "domain"),
      ...timestampQualityWarnings(domainsRes.data, "domain"),
    ]
  );

  const capsRes = await loadValidated<Capability>("capabilities");
  push(
    "capabilities",
    capsRes.data.length,
    capsRes.errors,
    [
      ...duplicateWarnings(capsRes.data, "capability"),
      ...freshnessWarnings(capsRes.data, "capability"),
      ...timestampQualityWarnings(capsRes.data, "capability"),
    ]
  );

  const roiRes = await loadValidated<ROIResult>("roi");
  push(
    "roi",
    roiRes.data.length,
    roiRes.errors,
    [
      ...duplicateWarnings(roiRes.data, "roi"),
      ...freshnessWarnings(roiRes.data, "roi"),
      ...timestampQualityWarnings(roiRes.data, "roi"),
    ]
  );

  const aiRes = await loadValidated<AIInsight>("ai");
  push(
    "ai",
    aiRes.data.length,
    aiRes.errors,
    [
      ...duplicateWarnings(aiRes.data, "ai"),
      ...freshnessWarnings(aiRes.data, "ai"),
      ...timestampQualityWarnings(aiRes.data, "ai"),
    ]
  );

  const eventRes = await loadValidated<Event>("events");
  push(
    "events",
    eventRes.data.length,
    eventRes.errors,
    [
      ...duplicateWarnings(eventRes.data, "event"),
      ...freshnessWarnings(eventRes.data, "event"),
      ...timestampQualityWarnings(eventRes.data, "event"),
    ]
  );

  const kpiRes = await loadValidated<KPI>("kpis");
  push(
    "kpis",
    kpiRes.data.length,
    kpiRes.errors,
    [
      ...duplicateWarnings(kpiRes.data, "kpi"),
      ...freshnessWarnings(kpiRes.data, "kpi"),
      ...timestampQualityWarnings(kpiRes.data, "kpi"),
    ]
  );

  const riskRes = await loadValidated<RiskEntity>("risk");
  push(
    "risk",
    riskRes.data.length,
    riskRes.errors,
    [
      ...duplicateWarnings(riskRes.data, "risk"),
      ...freshnessWarnings(riskRes.data, "risk"),
      ...timestampQualityWarnings(riskRes.data, "risk"),
    ]
  );

  const aiRecRes = await loadValidated<AIRecommendationSet>("aiRecommendations");
  push(
    "aiRecommendations",
    aiRecRes.data.length,
    aiRecRes.errors,
    [
      ...duplicateWarnings(aiRecRes.data, "ai recommendation"),
      ...freshnessWarnings(aiRecRes.data, "ai recommendation"),
      ...timestampQualityWarnings(aiRecRes.data, "ai recommendation"),
    ]
  );

  const dsRes = await loadValidated<DataSourceRegistry>("dataSources");
  push(
    "dataSources",
    dsRes.data.length,
    dsRes.errors,
    [
      ...duplicateWarnings(dsRes.data, "data source"),
      ...freshnessWarnings(dsRes.data, "data source"),
      ...timestampQualityWarnings(dsRes.data, "data source"),
    ]
  );

  return results;
}
