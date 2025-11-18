import type {
  LucidNode,
  LucidEdge,
  LucidParseResult,
} from "./lucidIngestion";

/**
 * In-memory Digital Enterprise store.
 * For now we treat the LucidParseResult (nodes + edges) as our view.
 */

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

const store = new Map<string, StoredDigitalEnterpriseView>();

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
  view: LucidParseResult | undefined
): Promise<void> {
  if (!view) {
    console.warn(
      "[DE-STORE] saveDigitalEnterpriseView called with undefined view",
      { projectId }
    );
    return;
  }

  const uploadedAt = new Date().toISOString();
  const stored: StoredDigitalEnterpriseView = {
    ...view,
    uploadedAt,
  };

  store.set(projectId, stored);

  const nodeCount = stored.nodes?.length ?? 0;
  const edgeCount = stored.edges?.length ?? 0;

  console.log(
    "[DE-STORE] saved view for project=%s nodes=%d edges=%d uploadedAt=%s",
    projectId,
    nodeCount,
    edgeCount,
    uploadedAt
  );
}

export async function getDigitalEnterpriseView(
  projectId: string
): Promise<StoredDigitalEnterpriseView | undefined> {
  const view = store.get(projectId);
  console.log("[DE-STORE] get view", {
    projectId,
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
  const view = await getDigitalEnterpriseView(projectId);

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
