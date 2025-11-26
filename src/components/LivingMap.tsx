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
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
};

const COLORS = {
  healthy: "#0ea5e9",
  warning: "#fbbf24",
  danger: "#f87171",
  neutral: "#94a3b8",
  disposition: {
    keep: "#22c55e",
    modernize: "#2563eb",
    replace: "#f97316",
    retire: "#ef4444",
  },
};

type LayerMode = "stack" | "domain" | "integration" | "disposition" | "roi" | "ai";

export function LivingMap({ data, height = 720, selectedNodeId, onSelectNode }: LivingMapProps) {
  const { data: simData, state, setMode, toggleNode } = useSimulationEngine(data);
  const [layout, setLayout] = useState<"flow" | "dagre">("dagre");
  const [layer, setLayer] = useState<LayerMode>("stack");

  const domainColors = useMemo(() => {
    const palette = ["#2563eb", "#0ea5e9", "#6366f1", "#14b8a6", "#f59e0b", "#fb7185", "#8b5cf6"];
    const seen = new Map<string, string>();
    let idx = 0;
    simData.nodes.forEach((n) => {
      const key = n.domain ?? "Other";
      if (!seen.has(key)) {
        seen.set(key, palette[idx % palette.length]);
        idx += 1;
      }
    });
    return seen;
  }, [simData.nodes]);
  const baseNodes: Node[] = simData.nodes.map((n, idx) => {
    const tooltip = [
      `AI Readiness: ${Math.round(n.aiReadiness ?? 0)}%`,
      `Opportunity: ${Math.round(n.opportunityScore ?? n.roiScore ?? 0)}%`,
      n.disposition ? `Disposition: ${n.disposition}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    return {
      id: n.id,
      data: {
        label: (
          <div title={tooltip}>
            <div className="text-xs font-semibold text-slate-900">{n.label}</div>
          </div>
        ),
        meta: n,
      },
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
    };
  });

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
    const healthScore = meta?.health ?? 60;
    const aiScore = meta?.aiReadiness ?? 55;
    const roiScore = meta?.roiScore ?? aiScore;
    const domainColor = domainColors.get(meta?.domain ?? "Other") ?? COLORS.neutral;
    const dispositionColor = meta?.disposition ? COLORS.disposition[meta.disposition] : COLORS.neutral;

    let color = COLORS.neutral;
    switch (layer) {
      case "domain":
        color = domainColor;
        break;
      case "disposition":
        color = dispositionColor;
        break;
      case "ai":
        color = aiScore >= 75 ? "#22c55e" : aiScore >= 50 ? "#eab308" : "#a855f7";
        break;
      case "roi":
        color = roiScore >= 75 ? "#22c55e" : roiScore >= 50 ? "#eab308" : "#a855f7";
        break;
      case "stack":
      case "integration":
      default:
        color = healthScore >= 75 ? COLORS.healthy : healthScore >= 50 ? COLORS.warning : COLORS.danger;
    }

    const isSelected = selectedNodeId === n.id;
    return {
      ...n,
      style: {
        ...n.style,
        border: isSelected ? `2px solid ${color}` : `1px solid ${color}`,
        boxShadow: isSelected ? `0 10px 24px ${color}55` : `0 6px 14px ${color}33`,
      },
    };
  });

  const onNodeClick = (_: any, node: Node) => {
    if (state.mode === "simulate") {
      toggleNode(node.id);
      return;
    }
    if (onSelectNode) {
      onSelectNode(node.id);
    }
  };

  const styledEdges = edges.map((e) => {
    const edgeMeta = simData.edges.find((m) => m.id === e.id);
    const baseWidth = Math.min(10, Math.max(2, (edgeMeta?.weight ?? 1) * 1.2));
    const activeWidth = layer === "integration" ? baseWidth * 1.25 : baseWidth;
    const stroke = layer === "integration" ? "#2563eb" : "#94a3b8";
    return {
      ...e,
      style: {
        ...(e.style || {}),
        strokeWidth: activeWidth,
        stroke,
        opacity: layer === "disposition" ? 0.7 : 0.9,
      },
    };
  });

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
          {([
            ["stack", "Stack"],
            ["domain", "Domain"],
            ["integration", "Integration"],
            ["disposition", "Disposition"],
            ["ai", "AI"],
            ["roi", "Heatmap/ROI"],
          ] as const).map(([key, labelText]) => (
            <button
              key={key}
              onClick={() => setLayer(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                layer === key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {labelText}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {layer === "domain" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Domains</span>
            {[...domainColors.entries()].map(([name, c]) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c }} />
                {name}
              </span>
            ))}
          </div>
        )}
        {layer === "disposition" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Disposition</span>
            {([
              ["keep", "Keep"],
              ["modernize", "Modernize"],
              ["replace", "Replace"],
              ["retire", "Retire"],
            ] as const).map(([k, labelText]) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.disposition[k] }} />
                {labelText}
              </span>
            ))}
          </div>
        )}
        {layer === "roi" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Heatmap</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#a855f7" }} />
              Low readiness
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#eab308" }} />
              Mid readiness
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              High readiness
            </span>
          </div>
        )}
        {layer === "ai" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">AI Opportunity</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#a855f7" }} />
              Low readiness
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#eab308" }} />
              Mid readiness
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              High readiness
            </span>
          </div>
        )}
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height }}>
        <ReactFlow
          nodes={
            layout === "dagre"
              ? coloredNodes.map((n) => {
                  const mapped = laidOutNodes.find((ln) => ln.id === n.id);
                  return { ...n, position: mapped?.position ?? n.position };
                })
              : coloredNodes
          }
          edges={styledEdges}
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
