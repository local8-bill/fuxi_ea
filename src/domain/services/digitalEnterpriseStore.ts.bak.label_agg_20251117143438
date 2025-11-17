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
  // ID from Lucid (node.id)
  systemId: string;
  id: string;

  // Preferred display name
  systemName: string;
  name: string;
  label: string;

  // How many integrations this system participates in
  integrationCount: number;
  integrations: number;
  degree: number;

  // Optional domain placeholder for future
  domain?: string | null;
}

export interface DigitalEnterpriseStats {
  systemsFuture: number;        // unique labeled systems
  integrationsFuture: number;   // unique system-to-system connections
  domainsDetected: number;      // placeholder for future domain clustering
  topSystems: TopSystemStat[];
}

const store = new Map<string, StoredDigitalEnterpriseView>();

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
 * - systemsFuture: count of unique labeled nodes
 * - integrationsFuture: number of edges
 * - domainsDetected: stubbed to 0 for now
 * - topSystems: top 10 by degree (connections), with multiple field aliases for UI
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

  // Degree map: how many edges touch each node
  const degree = new Map<string, number>();

  for (const n of nodes) {
    degree.set(n.id, 0);
  }

  for (const e of edges) {
    if (e.sourceId) {
      degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
    }
    if (e.targetId) {
      degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
    }
  }

  // System count: unique nodes that actually have a label
  const labeledNodes = nodes.filter(
    (n) => !!(n.label && n.label.toString().trim().length > 0)
  );
  const systemsFuture = labeledNodes.length;

  const integrationsFuture = edges.length;
  const domainsDetected = 0; // domain clustering to be implemented later

  const topSystems: TopSystemStat[] = labeledNodes
    .map((n) => {
      const d = degree.get(n.id) ?? 0;
      const label = n.label.toString();
      return {
        systemId: n.id,
        id: n.id,
        systemName: label,
        name: label,
        label,
        integrationCount: d,
        integrations: d,
        degree: d,
        domain: n.domain ?? null,
      };
    })
    .sort((a, b) => {
      // sort by degree DESC, then name ASC
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
