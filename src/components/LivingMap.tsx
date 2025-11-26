"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { LivingMapData, SimulationMode } from "@/types/livingMap";
import { applyDagreLayout } from "@/lib/graph/layout";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import "./ImpactGraph.css"; // reuse theme

type LivingMapProps = {
  data: LivingMapData;
  height?: number;
};

const COLORS = {
  healthy: "#0ea5e9",
  warning: "#fbbf24",
  danger: "#f87171",
  neutral: "#94a3b8",
};

export function LivingMap({ data, height = 720 }: LivingMapProps) {
  const { data: simData, state, setMode, toggleNode } = useSimulationEngine(data);
  const [layout, setLayout] = useState<"flow" | "dagre">("dagre");
  const [layer, setLayer] = useState<"health" | "ai" | "redundancy">("health");
  const baseNodes: Node[] = simData.nodes.map((n, idx) => ({
    id: n.id,
    data: { label: n.label, meta: n },
    position: { x: 120 * (idx % 5), y: 120 * Math.floor(idx / 5) },
    style: {
      borderRadius: 14,
      padding: 10,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#0f172a",
      boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
      cursor: state.mode === "simulate" ? "pointer" : "default",
    },
  }));

  const baseEdges: Edge[] = simData.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.weight ? `${e.weight.toFixed(1)} load` : undefined,
    style: {
      strokeWidth: Math.min(8, Math.max(2, (e.weight ?? 1) * 1.2)),
      stroke: "#94a3b8",
      opacity: 0.9,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  const laidOutNodes = useMemo(() => {
    if (layout === "dagre") {
      return applyDagreLayout(nodes, edges, "LR").nodes;
    }
    return nodes;
  }, [layout, nodes, edges]);

  const coloredNodes = nodes.map((n) => {
    const meta = simData.nodes.find((m) => m.id === n.id);
    const score =
      layer === "health"
        ? meta?.health ?? 50
        : layer === "ai"
        ? meta?.aiReadiness ?? 50
        : meta?.redundancyScore ?? 50;
    const color = score >= 75 ? COLORS.healthy : score >= 50 ? COLORS.warning : COLORS.danger;
    return {
      ...n,
      style: {
        ...n.style,
        border: `1px solid ${color}`,
        boxShadow: `0 6px 14px ${color}33`,
      },
    };
  });

  const onNodeClick = (_: any, node: Node) => {
    if (state.mode === "simulate") {
      toggleNode(node.id);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {(["inspect", "simulate", "optimize"] as SimulationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                state.mode === m ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          <button
            onClick={() => setLayout("flow")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              layout === "flow" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setLayout("dagre")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              layout === "dagre" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Dagre
          </button>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          <button
            onClick={() => setLayer("health")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              layer === "health" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Health
          </button>
          <button
            onClick={() => setLayer("ai")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              layer === "ai" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            AI Readiness
          </button>
          <button
            onClick={() => setLayer("redundancy")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              layer === "redundancy"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Redundancy
          </button>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height }}>
        <ReactFlow
          nodes={layout === "dagre" ? coloredNodes.map((n, i) => ({ ...n, position: laidOutNodes[i]?.position ?? n.position })) : coloredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      </div>
    </div>
  );
}
