import { promises as fs } from "fs";
import path from "path";
import { ZodArray, ZodTypeAny, z } from "zod";
import {
  AIInsightSchema,
  CapabilitySchema,
  DomainSchema,
  EventSchema,
  IntegrationSchema,
  KPISchema,
  ROIResultSchema,
  SystemSchema,
  RiskEntitySchema,
  AIRecommendationSetSchema,
  DataSourceRegistrySchema,
} from "./entities";

type SchemaName =
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

const schemaMap: Record<SchemaName, ZodArray<ZodTypeAny>> = {
  systems: z.array(SystemSchema),
  integrations: z.array(IntegrationSchema),
  domains: z.array(DomainSchema),
  capabilities: z.array(CapabilitySchema),
  roi: z.array(ROIResultSchema),
  ai: z.array(AIInsightSchema),
  events: z.array(EventSchema),
  kpis: z.array(KPISchema),
  risk: z.array(RiskEntitySchema),
  aiRecommendations: z.array(AIRecommendationSetSchema),
  dataSources: z.array(DataSourceRegistrySchema),
};

const defaultCandidates: Record<SchemaName, string[]> = {
  systems: [".fuxi/data/systems.json", ".fuxi/data/digital-enterprise/systems.json"],
  integrations: [".fuxi/data/integrations.json", ".fuxi/data/digital-enterprise/integrations.json"],
  domains: [".fuxi/data/domains.json"],
  capabilities: [".fuxi/data/capabilities.json"],
  roi: [".fuxi/data/roi.json", ".fuxi/data/insights/roi.json"],
  ai: [".fuxi/data/insights/ai_insights.json", ".fuxi/data/digital-enterprise/insights.json"],
  events: [".fuxi/data/events.json"],
  kpis: [".fuxi/data/kpis.json"],
  risk: [".fuxi/data/risk.json"],
  aiRecommendations: [".fuxi/data/ai_recommendations.json"],
  dataSources: [".fuxi/data/data_sources.json"],
};

export async function loadValidated<T = any>(
  name: SchemaName,
  candidates: string[] = defaultCandidates[name]
): Promise<{ data: T[]; errors: string[] }> {
  const schema = schemaMap[name];
  const errors: string[] = [];

  for (const relPath of candidates) {
    const filePath = path.join(process.cwd(), relPath);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        errors.push(`Validation failed for ${relPath}: ${result.error.message}`);
        continue;
      }
      return { data: result.data as T[], errors };
    } catch (err: any) {
      if (err?.code === "ENOENT") {
        errors.push(`Missing ${relPath}`);
        continue;
      }
      errors.push(`Error reading ${relPath}: ${err?.message || err}`);
    }
  }

  return { data: [], errors };
}
