import dagre from "dagre";
import type { Node, Edge } from "reactflow";

type Direction = "TB" | "LR";

/**
 * Apply a Dagre layout to React Flow nodes/edges.
 * Keeps existing ids/data; only position and source/target anchors are updated.
 */
export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: Direction = "LR") {
  if (!nodes.length) return { nodes, edges };

  // If there are no edges, lay out nodes in a simple grid to avoid overlap.
  if (!edges.length) {
    const cols = 10;
    const hGap = 220;
    const vGap = 120;
    const laidOut = nodes.map((n, idx) => ({
      ...n,
      position: {
        x: (idx % cols) * hGap,
        y: Math.floor(idx / cols) * vGap,
      },
    }));
    return { nodes: laidOut, edges };
  }

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({ weight: 1 }));

  nodes.forEach((n) => {
    const width = 160;
    const height = 60;
    g.setNode(n.id, { width, height });
  });

  edges
    .filter((e) => e && (e as any).source && (e as any).target)
    .forEach((e) =>
      g.setEdge(e.source, e.target, {
        weight: (e as any)?.data?.weight ?? (e as any)?.weight ?? 1,
      }),
    );

  // Ensure every dagre edge has a weight to avoid runtime errors
  g.edges().forEach((edge) => {
    const label = g.edge(edge);
    if (!label || typeof (label as any).weight !== "number") {
      g.setEdge(edge.v, edge.w, { ...(label || {}), weight: 1 });
    }
  });
  try {
    dagre.layout(g);
  } catch (err) {
    console.warn("[DAGRE] layout failed, returning original positions", err);
    return { nodes, edges };
  }

  const laidOutNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    const x = Number.isFinite(pos?.x) ? pos!.x : 0;
    const y = Number.isFinite(pos?.y) ? pos!.y : 0;
    return {
      ...n,
      position: { x, y },
      sourcePosition: direction === "LR" ? "right" : "bottom",
      targetPosition: direction === "LR" ? "left" : "top",
    };
  });

  return { nodes: laidOutNodes, edges };
}
