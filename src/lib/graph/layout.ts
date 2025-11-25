import dagre from "dagre";
import type { Node, Edge } from "reactflow";

type Direction = "TB" | "LR";

/**
 * Apply a Dagre layout to React Flow nodes/edges.
 * Keeps existing ids/data; only position and source/target anchors are updated.
 */
export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: Direction = "LR") {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    const width = 160;
    const height = 60;
    g.setNode(n.id, { width, height });
  });

  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const laidOutNodes = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
      sourcePosition: direction === "LR" ? "right" : "bottom",
      targetPosition: direction === "LR" ? "left" : "top",
    };
  });

  return { nodes: laidOutNodes, edges };
}
