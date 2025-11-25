"use client";

import React from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import type { ImpactGraphData } from "@/types/impactGraph";

type ImpactGraphProps = {
  graph: ImpactGraphData;
  height?: number;
};

const NODE_COLORS = ["#2563eb", "#9333ea", "#0ea5e9", "#1e293b", "#334155", "#64748b"];

export function ImpactGraph({ graph, height = 520 }: ImpactGraphProps) {
  if (!graph.nodes.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No dependency data available.
      </div>
    );
  }

  const initialNodes: Node[] = graph.nodes.map((n, idx) => ({
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
    style: {
      borderRadius: 12,
      padding: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#0f172a",
      boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
    },
  }));

  const initialEdges: Edge[] = graph.edges.map((e, idx) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.weight ? `${e.weight.toFixed(1)} links` : undefined,
    style: { strokeWidth: Math.min(6, Math.max(2, e.weight ?? 2)), stroke: "#94a3b8" },
    animated: false,
    type: "default",
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height }}>
      <ReactFlow
        nodes={nodes}
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
