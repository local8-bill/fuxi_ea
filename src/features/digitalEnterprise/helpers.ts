import type { LivingMapData } from "@/types/livingMap";

export type SnapshotNode = {
  id?: string | number;
  label?: string;
  name?: string;
  domain?: string | null;
  state?: string;
};

export type SnapshotEdge = {
  id?: string | number;
  sourceId?: string | number;
  source?: string | number;
  targetId?: string | number;
  target?: string | number;
  confidence?: number;
  data?: { inferred?: boolean };
  inferred?: boolean;
};

export interface GraphSnapshotPayload {
  nodes?: SnapshotNode[];
  edges?: SnapshotEdge[];
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0";
  return value.toLocaleString();
}

export function stableScore(id: string, base: number, spread: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return base + normalized * spread;
}

export function buildLivingMapData(view: GraphSnapshotPayload): LivingMapData {
  const nodes = Array.isArray(view.nodes) ? view.nodes : [];
  const edges = Array.isArray(view.edges) ? view.edges : [];
  const degree = new Map<string, number>();
  edges.forEach((edge) => {
    const src = edge?.sourceId ?? edge?.source;
    const tgt = edge?.targetId ?? edge?.target;
    if (src != null) degree.set(String(src), (degree.get(String(src)) ?? 0) + 1);
    if (tgt != null) degree.set(String(tgt), (degree.get(String(tgt)) ?? 0) + 1);
  });

  const livingNodes: LivingMapData["nodes"] = nodes.map((node) => {
    const id = String(node?.id ?? "");
    const label = String(node?.label ?? node?.name ?? "Unknown");
    return {
      id,
      label,
      domain: node?.domain ?? null,
      integrationCount: degree.get(id) ?? 0,
      state: node?.state,
      health: stableScore(id, 55, 30),
      aiReadiness: stableScore(`${id}-ai`, 45, 45),
      roiScore: stableScore(`${id}-roi`, 35, 50),
    };
  });

  const livingEdges: LivingMapData["edges"] = edges.map((edge, idx) => ({
    id: String(edge?.id ?? `edge-${idx}`),
    source: String(edge?.sourceId ?? edge?.source ?? ""),
    target: String(edge?.targetId ?? edge?.target ?? ""),
    weight: 1,
    kind: "api",
    confidence: typeof edge?.confidence === "number" ? edge.confidence : undefined,
    inferred: Boolean(edge?.data?.inferred || edge?.inferred),
  }));

  return { nodes: livingNodes, edges: livingEdges };
}

export function buildInsight(role: string, motivation: string, systemName: string, peerName: string, tone: string) {
  const base = role.toLowerCase().includes("cfo")
    ? `From a finance lens, ${systemName} and ${peerName} create duplicate run costs.`
    : `The ${systemName} -> ${peerName} path is carrying redundant flows.`;
  const toneSuffix = tone === "empathetic" ? " I can soften the rollout if you need." : tone === "analytical" ? " Let's quantify the delta next." : " Ready to act when you are.";
  return `${base} Aligning this connection accelerates ${motivation.toLowerCase()}.${toneSuffix}`;
}
