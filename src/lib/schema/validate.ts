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
} from "./entities";

type DatasetName =
  | "systems"
  | "integrations"
  | "domains"
  | "capabilities"
  | "roi"
  | "ai"
  | "events"
  | "kpis";

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
    [...duplicateWarnings(systemsRes.data, "system"), ...freshnessWarnings(systemsRes.data, "system")]
  );

  const integrationsRes = await loadValidated<Integration>("integrations");
  push(
    "integrations",
    integrationsRes.data.length,
    integrationsRes.errors,
    [
      ...duplicateWarnings(integrationsRes.data, "integration"),
      ...freshnessWarnings(integrationsRes.data, "integration"),
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
    ]
  );

  const roiRes = await loadValidated<ROIResult>("roi");
  push(
    "roi",
    roiRes.data.length,
    roiRes.errors,
    [...duplicateWarnings(roiRes.data, "roi"), ...freshnessWarnings(roiRes.data, "roi")]
  );

  const aiRes = await loadValidated<AIInsight>("ai");
  push(
    "ai",
    aiRes.data.length,
    aiRes.errors,
    [...duplicateWarnings(aiRes.data, "ai"), ...freshnessWarnings(aiRes.data, "ai")]
  );

  const eventRes = await loadValidated<Event>("events");
  push(
    "events",
    eventRes.data.length,
    eventRes.errors,
    [...duplicateWarnings(eventRes.data, "event"), ...freshnessWarnings(eventRes.data, "event")]
  );

  const kpiRes = await loadValidated<KPI>("kpis");
  push(
    "kpis",
    kpiRes.data.length,
    kpiRes.errors,
    [...duplicateWarnings(kpiRes.data, "kpi"), ...freshnessWarnings(kpiRes.data, "kpi")]
  );

  return results;
}
