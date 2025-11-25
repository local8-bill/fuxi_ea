"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

import type { ImpactGraphData } from "@/types/impactGraph";
import { applyDagreLayout } from "@/lib/graph/layout";

type ImpactGraphProps = {
  graph: ImpactGraphData;
  height?: number;
  colorMode?: "domain" | "impact";
  showEdgeLabels?: boolean;
  weightEdges?: boolean;
  layout?: "flow" | "dagre";
};

const NODE_COLORS = ["#2563eb", "#9333ea", "#0ea5e9", "#1e293b", "#334155", "#64748b"];

function domainColor(domain: string | null | undefined) {
  if (!domain) return "#2563eb";
  const idx = Math.abs(hashString(domain)) % NODE_COLORS.length;
  return NODE_COLORS[idx];
}

function impactColor(impactScore?: number) {
  const v = Math.max(0, Math.min(100, impactScore ?? 0));
  if (v >= 80) return "#0ea5e9";
  if (v >= 60) return "#2563eb";
  if (v >= 40) return "#475569";
  return "#cbd5e1";
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function ImpactGraph({
  graph,
  height = 520,
  colorMode = "domain",
  showEdgeLabels = false,
  weightEdges = true,
  layout = "flow",
}: ImpactGraphProps) {
  if (!graph.nodes.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No dependency data available.
      </div>
    );
  }

  const baseNodes: Node[] = graph.nodes.map((n, idx) => ({
    id: n.id,
    data: {
      label: n.label,
      impact: n.impactScore ?? 0,
      readiness: n.readiness ?? 0,
    },
    position: {
      x: 150 * (idx % 3),
      y: 120 * Math.floor(idx / 3),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      borderRadius: 12,
      padding: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#0f172a",
      boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
    },
  }));

  const baseEdges: Edge[] = graph.edges.map((e, idx) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: showEdgeLabels && e.weight ? `${e.weight.toFixed(1)} links` : undefined,
    style: {
      strokeWidth: weightEdges ? Math.min(6, Math.max(2, e.weight ?? 2)) : 2,
      stroke: "#94a3b8",
    },
    animated: false,
    type: "default",
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  const laidOutNodes = useMemo(() => {
    if (layout === "dagre") {
      const result = applyDagreLayout(nodes, edges);
      return result.nodes;
    }
    return nodes;
  }, [layout, nodes, edges]);

  const coloredNodes = nodes.map((n) => {
    const base = graph.nodes.find((gn) => gn.id === n.id);
    const color =
      colorMode === "domain"
        ? domainColor(base?.domain)
        : impactColor(base?.impactScore);
    return {
      ...n,
      style: {
        ...n.style,
        border: `1px solid ${color}`,
        boxShadow: `0 6px 14px ${color}1a`,
      },
    };
  });

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height }}>
      <ReactFlow
        nodes={
          layout === "dagre"
            ? coloredNodes.map((n, i) => ({
                ...n,
                position: laidOutNodes[i]?.position ?? n.position,
                sourcePosition: (laidOutNodes[i]?.sourcePosition as any) ?? n.sourcePosition,
                targetPosition: (laidOutNodes[i]?.targetPosition as any) ?? n.targetPosition,
              }))
            : coloredNodes
        }
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap
          nodeStrokeColor={(n) => {
            const idx = nodes.findIndex((x) => x.id === n.id);
            return NODE_COLORS[idx % NODE_COLORS.length];
          }}
          nodeColor={(n) => {
            const idx = nodes.findIndex((x) => x.id === n.id);
            return NODE_COLORS[idx % NODE_COLORS.length];
          }}
        />
        <Controls />
        <Background gap={16} color="#e2e8f0" />
      </ReactFlow>
    </div>
  );
}
