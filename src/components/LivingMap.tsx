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
  searchTerm?: string;
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

export function LivingMap({ data, height = 720, selectedNodeId, onSelectNode, searchTerm }: LivingMapProps) {
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

  const edgeKindColor = (kind?: string) => {
    switch (kind) {
      case "api":
        return "#a3bffa";
      case "data":
        return "#bae6fd";
      case "workflow":
        return "#ddd6fe";
      case "manual":
        return "#e2e8f0";
      default:
        return "#cbd5e1";
    }
  };

  const baseEdges: Edge[] = simData.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: undefined,
    data: { kind: e.kind },
    style: {
      strokeWidth: 1.6,
      stroke: edgeKindColor(e.kind),
      opacity: 0.7,
      strokeDasharray: "5 4",
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

  const normalizedSearch = (searchTerm ?? "").toLowerCase();

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
    const matchesSearch =
      normalizedSearch.length > 1 &&
      (meta?.label?.toLowerCase().includes(normalizedSearch) || meta?.domain?.toLowerCase().includes(normalizedSearch));
    const baseBorder = "#e2e8f0";
    const highlightBorder = "#cbd5e1";
    return {
      ...n,
      style: {
        ...n.style,
        border: isSelected || matchesSearch ? `2px solid ${highlightBorder}` : `1px solid ${baseBorder}`,
        boxShadow: isSelected || matchesSearch ? "0 4px 12px rgba(15,23,42,0.08)" : "0 2px 8px rgba(15,23,42,0.06)",
        opacity: normalizedSearch && !matchesSearch && !isSelected ? 0.7 : 1,
        background: "#ffffff",
      },
      data: {
        ...n.data,
        meta,
        tooltip: [
          meta?.label,
          meta?.domain ? `Domain: ${meta.domain}` : null,
          meta?.disposition ? `Disposition: ${meta.disposition}` : null,
          `AI: ${Math.round(aiScore)}% · ROI: ${Math.round(roiScore)}%`,
          meta?.aiSummary ? `Note: ${meta.aiSummary}` : null,
        ]
          .filter(Boolean)
          .join(" • "),
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
    const stroke = edgeKindColor((e as any).data?.kind);
    const baseWidth = layer === "integration" ? 2 : 1.6;
    return {
      ...e,
      style: {
        ...(e.style || {}),
        strokeWidth: baseWidth,
        stroke,
        opacity: 0.7,
        strokeDasharray: "5 4",
      },
    };
  });

  const btnBase =
    "rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {(["inspect", "simulate", "optimize"] as SimulationMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-label={`Set mode to ${m}`}
              className={`${btnBase} ${
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
            aria-label="Set layout to free"
            className={`${btnBase} ${
              layout === "flow" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setLayout("dagre")}
            aria-label="Set layout to dagre"
            className={`${btnBase} ${
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
              aria-label={`Show ${labelText} layer`}
              className={`${btnBase} ${
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
              <span key={name} className="fx-pill">
                <span className="fx-legend-dot" style={{ backgroundColor: c }} />
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
              <span key={k} className="fx-pill">
                <span className="fx-legend-dot" style={{ backgroundColor: COLORS.disposition[k] }} />
                {labelText}
              </span>
            ))}
          </div>
        )}
        {layer === "roi" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Heatmap</span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#a855f7" }} />
              Low readiness
            </span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#eab308" }} />
              Mid readiness
            </span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#22c55e" }} />
              High readiness
            </span>
          </div>
        )}
        {layer === "ai" && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">AI Opportunity</span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#a855f7" }} />
              Low readiness
            </span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#eab308" }} />
              Mid readiness
            </span>
            <span className="fx-pill">
              <span className="fx-legend-dot" style={{ backgroundColor: "#22c55e" }} />
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
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      </div>
    </div>
  );
}
