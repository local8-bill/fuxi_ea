import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const GRAPH_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

export type HarmonizationSummary = {
  systems: number;
  integrations: number;
  domains: number;
  platformBreakdown: Array<{ platform: string; systems: number }>;
};

const normalizeFilters = (platforms: string[]) =>
  platforms
    .map((platform) => platform?.toString().toLowerCase().trim())
    .filter((platform) => Boolean(platform)) as string[];

const matchesPlatform = (platformValue: unknown, filters: string[]) => {
  if (!filters.length) return true;
  if (typeof platformValue !== "string" || !platformValue.trim()) return false;
  const normalized = platformValue.toLowerCase();
  return filters.some((filter) => normalized.includes(filter));
};

export async function loadHarmonizationSummary(platforms: string[] = []): Promise<HarmonizationSummary> {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf8");
    const json = JSON.parse(raw) as { nodes?: Array<Record<string, unknown>>; edges?: unknown[] };
    const normalizedFilters = normalizeFilters(platforms);
    const nodes = Array.isArray(json?.nodes) ? json.nodes : [];
    const filteredNodes = nodes.filter((node) => matchesPlatform(node?.platform, normalizedFilters));
    const edges = Array.isArray(json?.edges) ? json.edges : [];

    const domains = new Set<string>();
    const platformCounts = new Map<string, number>();
    filteredNodes.forEach((node) => {
      const domain = typeof node?.domain === "string" ? node.domain : null;
      if (domain) domains.add(domain);
      const platformLabel = typeof node?.platform === "string" && node.platform.trim() ? node.platform.trim() : "Unlabeled";
      platformCounts.set(platformLabel, (platformCounts.get(platformLabel) ?? 0) + 1);
    });

    const platformBreakdown = Array.from(platformCounts.entries())
      .map(([platform, systems]) => ({ platform, systems }))
      .sort((a, b) => b.systems - a.systems);

    return {
      systems: filteredNodes.length,
      integrations: edges.length,
      domains: domains.size,
      platformBreakdown,
    };
  } catch {
    return { systems: 0, integrations: 0, domains: 0, platformBreakdown: [] };
  }
}
