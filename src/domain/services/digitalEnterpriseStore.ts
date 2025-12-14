import fs from "fs/promises";
import path from "path";
import type {
  LucidNode,
  LucidEdge,
  LucidParseResult,
} from "./lucidIngestion";
import { loadValidated } from "../../lib/schema/loaders";

interface StoredDigitalEnterpriseView extends LucidParseResult {
  uploadedAt: string;
}

export interface TopSystemStat {
  // ID from a representative Lucid node
  systemId: string;
  id: string;

  // Preferred display name
  systemName: string;
  name: string;
  label: string;

  // How many integrations this system participates in (degree)
  integrationCount: number;
  integrations: number;
  degree: number;

  // Optional domain placeholder for future
  domain?: string | null;
}

export interface DigitalEnterpriseStats {
  // Conceptual systems: unique normalized labels
  systemsFuture: number;
  // Raw edges from the Lucid diagram
  integrationsFuture: number;
  // Placeholder for future domain clustering
  domainsDetected: number;
  // Top systems by aggregated degree
  topSystems: TopSystemStat[];
}

const DATA_ROOT =
  process.env.FUXI_DATA_ROOT ??
  path.join(process.cwd(), ".fuxi", "data");
const DIGITAL_ENTERPRISE_DIR = path.join(DATA_ROOT, "digital-enterprise");

const MAX_NODES = 5000;
const MAX_EDGES = 10000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const cache = new Map<string, StoredDigitalEnterpriseView>();

function safeProjectId(projectId: string | null | undefined): string {
  const sanitized = (projectId || "default").replace(/[^a-zA-Z0-9_-]/g, "-");
  return sanitized || "default";
}

async function ensureDir() {
  await fs.mkdir(DIGITAL_ENTERPRISE_DIR, { recursive: true });
}

function projectFile(projectId: string) {
  return path.join(DIGITAL_ENTERPRISE_DIR, `${safeProjectId(projectId)}.json`);
}

async function readFromDisk(
  projectId: string,
): Promise<StoredDigitalEnterpriseView | undefined> {
  try {
    const filePath = projectFile(projectId);
    const raw = await fs.readFile(filePath, "utf8");
    if (raw.length > MAX_FILE_BYTES) {
      console.warn("[DE-STORE] File too large, ignoring", {
        projectId,
        bytes: raw.length,
      });
      return undefined;
    }
    const parsed = JSON.parse(raw) as StoredDigitalEnterpriseView;
    cache.set(projectId, parsed);
    return parsed;
  } catch (err: any) {
    if (err?.code !== "ENOENT") {
      console.warn("[DE-STORE] readFromDisk error", { projectId, err });
    }
    return undefined;
  }
}

async function writeToDisk(projectId: string, view: StoredDigitalEnterpriseView) {
  await ensureDir();
  const filePath = projectFile(projectId);
  const payload = JSON.stringify(view, null, 2);
  if (payload.length > MAX_FILE_BYTES) {
    throw new Error("Digital Enterprise view exceeds size limits");
  }
  await fs.writeFile(filePath, payload, "utf8");
}

function normalizeLabel(raw: unknown): string {
  if (raw == null) return "";
  let s = String(raw).trim();
  // Strip leading/trailing quotes (handle messy CSV leftovers)
  while (s.startsWith('"') || s.startsWith("'")) {
    s = s.slice(1).trim();
  }
  while (s.endsWith('"') || s.endsWith("'")) {
    s = s.slice(0, -1).trim();
  }
  return s;
}

export async function saveDigitalEnterpriseView(
  projectId: string,
  view: LucidParseResult | undefined,
): Promise<void> {
  const safeId = safeProjectId(projectId);

  if (!view) {
    console.warn("[DE-STORE] saveDigitalEnterpriseView called with undefined view", {
      projectId: safeId,
    });
    return;
  }

  const nodes = Array.isArray(view.nodes) ? view.nodes : [];
  const edges = Array.isArray(view.edges) ? view.edges : [];

  if (nodes.length > MAX_NODES) {
    throw new Error(`Too many nodes (${nodes.length}); limit ${MAX_NODES}`);
  }
  if (edges.length > MAX_EDGES) {
    throw new Error(`Too many edges (${edges.length}); limit ${MAX_EDGES}`);
  }

  const uploadedAt = new Date().toISOString();
  const stored: StoredDigitalEnterpriseView = {
    nodes,
    edges,
    uploadedAt,
  };

  cache.set(safeId, stored);
  await writeToDisk(safeId, stored);

  console.log(
    "[DE-STORE] saved view for project=%s nodes=%d edges=%d uploadedAt=%s",
    safeId,
    nodes.length,
    edges.length,
    uploadedAt,
  );
}

export async function getDigitalEnterpriseView(
  projectId: string
): Promise<StoredDigitalEnterpriseView | undefined> {
  const safeId = safeProjectId(projectId);
  const cached = cache.get(safeId);
  if (cached) return cached;

  const view = await readFromDisk(safeId);

  console.log("[DE-STORE] get view", {
    projectId: safeId,
    found: !!view,
    nodes: view?.nodes?.length ?? 0,
    edges: view?.edges?.length ?? 0,
  });
  return view;
}

/**
 * Compute stats from the stored view.
 *
 * - systemsFuture: number of unique normalized labels (conceptual systems)
 * - integrationsFuture: number of edges
 * - domainsDetected: stubbed to 0 for now
 * - topSystems: top 10 by **aggregated degree per label**
 */
export async function getStatsForProject(
  projectId: string
): Promise<DigitalEnterpriseStats> {
  // Prefer validated `.fuxi/data` artifacts when available
  const validatedSystems = await loadValidated<any>("systems");
  const validatedIntegrations = await loadValidated<any>("integrations");

  if (validatedSystems.data.length && validatedIntegrations.data.length) {
    const degreeBySystem = new Map<string, number>();
    validatedSystems.data.forEach((s: any) => degreeBySystem.set(s.id, 0));
    validatedIntegrations.data.forEach((e: any) => {
      if (e.sourceSystemId) {
        degreeBySystem.set(e.sourceSystemId, (degreeBySystem.get(e.sourceSystemId) ?? 0) + 1);
      }
      if (e.targetSystemId) {
        degreeBySystem.set(e.targetSystemId, (degreeBySystem.get(e.targetSystemId) ?? 0) + 1);
      }
    });

    const topSystems = validatedSystems.data
      .map((s: any) => {
        const degree = degreeBySystem.get(s.id) ?? 0;
        return {
          systemId: s.id,
          id: s.id,
          systemName: s.name,
          name: s.name,
          label: s.name,
          integrationCount: degree,
          integrations: degree,
          degree,
          domain: s.domainId ?? null,
        } as TopSystemStat;
      })
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 10);

    return {
      systemsFuture: validatedSystems.data.length,
      integrationsFuture: validatedIntegrations.data.length,
      domainsDetected: 0,
      topSystems,
    };
  }

  const view = await getDigitalEnterpriseView(safeProjectId(projectId));

  if (!view || !Array.isArray(view.nodes) || !Array.isArray(view.edges)) {
    console.warn("[DE-STATS] No view for project, returning zeros", {
      projectId,
    });
    return {
      systemsFuture: 0,
      integrationsFuture: 0,
      domainsDetected: 0,
      topSystems: [],
    };
  }

  const nodes: LucidNode[] = view.nodes;
  const edges: LucidEdge[] = view.edges;

  // Degree per node ID: how many edges touch this Lucid node
  const degreeByNode = new Map<string, number>();
  for (const n of nodes) {
    degreeByNode.set(n.id, 0);
  }
  for (const e of edges) {
    if (e.sourceId) {
      degreeByNode.set(e.sourceId, (degreeByNode.get(e.sourceId) ?? 0) + 1);
    }
    if (e.targetId) {
      degreeByNode.set(e.targetId, (degreeByNode.get(e.targetId) ?? 0) + 1);
    }
  }

  // Aggregate by normalized label (conceptual system name)
  interface Agg {
    label: string;
    degree: number;
    domain?: string | null;
    representativeId: string;
  }

  const aggByLabel = new Map<string, Agg>();

  for (const n of nodes) {
    const label = normalizeLabel(n.label);
    if (!label) continue; // skip unlabeled

    const nodeDegree = degreeByNode.get(n.id) ?? 0;
    const key = label;
    const existing = aggByLabel.get(key);

    if (!existing) {
      aggByLabel.set(key, {
        label,
        degree: nodeDegree,
        domain: n.domain ?? null,
        representativeId: n.id,
      });
    } else {
      // Sum degree across all shapes that share this label
      existing.degree += nodeDegree;
    }
  }

  const systemsFuture = aggByLabel.size;
  const integrationsFuture = edges.length;
  const domainsDetected = 0; // future feature

  const topSystems: TopSystemStat[] = Array.from(aggByLabel.values())
    .map((agg) => {
      const d = agg.degree;
      const label = agg.label;
      return {
        systemId: agg.representativeId,
        id: agg.representativeId,
        systemName: label,
        name: label,
        label,
        integrationCount: d,
        integrations: d,
        degree: d,
        domain: agg.domain ?? null,
      };
    })
    .sort((a, b) => {
      if (b.degree !== a.degree) return b.degree - a.degree;
      return a.systemName.localeCompare(b.systemName);
    })
    .slice(0, 10);

  const stats: DigitalEnterpriseStats = {
    systemsFuture,
    integrationsFuture,
    domainsDetected,
    topSystems,
  };

  console.log("[DE-STATS] project=%s systems=%d integrations=%d topSystems=%d", {
    projectId,
    systemsFuture,
    integrationsFuture,
    topSystems: topSystems.length,
  });

  return stats;
}

// Backwards-compatible alias if anything still imports the old name
export { saveDigitalEnterpriseView as saveLucidItemsForProject };
