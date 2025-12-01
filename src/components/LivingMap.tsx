"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  OnInit,
  Viewport,
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
  healthy: "#2563eb",
  warning: "#f59e0b",
  danger: "#f87171",
  neutral: "#94a3b8",
  domains: {
    commerce: "#f97316",
    erp: "#f59e0b",
    crm: "#a855f7",
    data: "#0ea5e9",
    integration: "#22c55e",
    hr: "#6366f1",
    finance: "#0ea5e9",
    logistics: "#14b8a6",
    "core platform": "#0891b2",
    "order management": "#f472b6",
    other: "#94a3b8",
  },
  disposition: {
    keep: "#22c55e",
    modernize: "#0ea5e9",
    replace: "#f97316",
    retire: "#ef4444",
  },
};

type LayerMode = "stack" | "domain" | "integration" | "disposition" | "roi" | "ai";

function normalizeDomainValue(d?: string | null): string {
  const raw = (d ?? "").toString().trim();
  if (raw) return raw;
  // Only fallback to heuristics when no domain is provided.
  const v = raw.toLowerCase();
  if (v.includes("commerce") || v.includes("omni") || v.includes("order") || v.includes("cart")) return "Commerce";
  if (v.includes("order management")) return "Order Management";
  if (v.includes("erp") || v.includes("sap") || v.includes("oracle") || v.includes("finance")) return "ERP";
  if (v.includes("crm") || v.includes("salesforce") || v.includes("customer")) return "CRM";
  if (v.includes("data") || v.includes("lake") || v.includes("warehouse")) return "Data";
  if (v.includes("integration") || v.includes("api") || v.includes("connector") || v.includes("mulesoft") || v.includes("boomi"))
    return "Integration";
  if (v.includes("hr") || v.includes("people") || v.includes("workday")) return "HR";
  if (v.includes("logistics") || v.includes("supply")) return "Logistics";
  if (v.includes("core") || v.includes("platform")) return "Core Platform";
  if (v.includes("billing")) return "Finance";
  return "Other";
}

export function LivingMap({ data, height = 720, selectedNodeId, onSelectNode, searchTerm }: LivingMapProps) {
  const { data: simData, state, setMode, toggleNode } = useSimulationEngine(data);
  const [layout, setLayout] = useState<"flow" | "dagre">("dagre");
  const [direction, setDirection] = useState<"LR" | "TB">("TB");
  const [layer, setLayer] = useState<LayerMode>("domain");
  const [flowInstance, setFlowInstance] = useState<ReturnType<OnInit> | null>(null);
  const [showOtherDomain, setShowOtherDomain] = useState<boolean>(true);
  const [domainBoxes, setDomainBoxes] = useState<
    Array<{ label: string; x: number; width: number; height: number }>
  >([]);
  const [transform, setTransform] = useState<[number, number, number]>([0, 0, 1]);
  const [showDomainLegend, setShowDomainLegend] = useState<boolean>(false);
  const [hiddenDomains, setHiddenDomains] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const handler = () => setShowOtherDomain((prev) => !prev);
    window.addEventListener("livingmap:toggle-other", handler);
    return () => window.removeEventListener("livingmap:toggle-other", handler);
  }, []);

  const domainColors = useMemo(() => {
    const palette = COLORS.domains;
    const seen = new Map<string, string>();
    simData.nodes.forEach((n) => {
      const domain = normalizeDomainValue((n as any).domain);
      const key = domain || "Other";
      if (!seen.has(key)) {
        const color =
          (palette as any)[key.toLowerCase()] ??
          (palette as any)["other"] ??
          COLORS.neutral;
        seen.set(key, color);
      }
    });
    if (!seen.size) {
      seen.set("Other", (palette as any)["other"] ?? COLORS.neutral);
    }
    return seen;
  }, [simData.nodes]);

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    simData.nodes.forEach((n) => map.set(n.id, n.label || n.id));
    return map;
  }, [simData.nodes]);

  const neighbors = useMemo(() => {
    const up = new Map<string, Set<string>>();
    const down = new Map<string, Set<string>>();
    simData.edges.forEach((e) => {
      if (!e.source || !e.target) return;
      if (!down.has(e.source)) down.set(e.source, new Set());
      if (!up.has(e.target)) up.set(e.target, new Set());
      down.get(e.source)!.add(e.target);
      up.get(e.target)!.add(e.source);
    });
    return { up, down };
  }, [simData.edges]);
  const baseNodes: Node[] = useMemo(
    () =>
      simData.nodes.map((n, idx) => {
        const domainKey = normalizeDomainValue((n as any).domain);
        const upstreamIds = neighbors.up.get(n.id) ?? new Set();
        const downstreamIds = neighbors.down.get(n.id) ?? new Set();
        const upstreamLabels = Array.from(upstreamIds).map((id) => labelById.get(id) ?? id);
        const downstreamLabels = Array.from(downstreamIds).map((id) => labelById.get(id) ?? id);
        const tooltip = [
          `AI Readiness: ${Math.round(n.aiReadiness ?? 0)}%`,
          `Opportunity: ${Math.round(n.opportunityScore ?? n.roiScore ?? 0)}%`,
          n.disposition ? `Disposition: ${n.disposition}` : null,
          upstreamLabels.length ? `Upstream: ${upstreamLabels.join(", ")}` : null,
          downstreamLabels.length ? `Downstream: ${downstreamLabels.join(", ")}` : null,
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
      }),
    [simData.nodes, state.mode],
  );

  const edgeKindColor = (kind?: string) => {
    switch (kind) {
      case "api":
        return "#2563eb";
      case "data":
        return "#16a34a";
      case "workflow":
        return "#a855f7";
      case "manual":
        return "#94a3b8";
      default:
        return "#cbd5e1";
    }
  };

  const baseEdges: Edge[] = useMemo(
    () =>
      simData.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: undefined,
        data: { kind: e.kind },
        type: "straight",
        style: {
          strokeWidth: 1.6,
          stroke: edgeKindColor(e.kind),
          opacity: 0.8,
          strokeDasharray: "5 4",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
      })),
    [simData.edges],
  );

  const laidOutNodes = useMemo(() => {
    let boxes: Array<{ label: string; x: number; width: number; height: number }> = [];
    // Group by domain: place nodes in columns by domain key.
  if (layer === "domain") {
    const domains = Array.from(
      new Set(
        baseNodes
          .map((n) => {
            const meta = simData.nodes.find((m) => m.id === n.id);
            const norm = normalizeDomainValue(meta?.domain);
            if ((!showOtherDomain && norm === "Other") || hiddenDomains.has(norm)) return null;
            return norm;
          })
          .filter(Boolean),
      ),
    ).sort();
    const domainIndex = new Map<string, number>();
    domains.forEach((d, idx) => domainIndex.set(d || "Other", idx));

    // Widen columns and add vertical padding so domains feel less cramped.
    const hGap = 420;
    const vGap = 180;
    const maxRows = 10;
    const counts: Record<string, number> = {};

    boxes = domains.map((d, idx) => ({
      label: d,
      x: idx * hGap - 40,
      width: hGap - 80,
      height: 1200, // generous vertical space
    }));

    const laidOut = baseNodes
      .map((n) => {
        const meta = simData.nodes.find((m) => m.id === n.id);
        const domain = normalizeDomainValue(meta?.domain);
        if ((!showOtherDomain && domain === "Other") || hiddenDomains.has(domain)) return null;
        const col = domainIndex.get(domain) ?? 0;
        counts[domain] = (counts[domain] ?? 0) + 1;
        const row = (counts[domain] - 1) % maxRows;
        const rowBlock = Math.floor((counts[domain] - 1) / maxRows);
        return {
          ...n,
          position: {
            x: col * hGap + rowBlock * 60,
            y: 120 + row * vGap, // add top padding
          },
        };
      })
      .filter(Boolean) as Node[];
    setDomainBoxes(boxes);
      return laidOut;
    }

    if (layout === "dagre") {
      return applyDagreLayout(baseNodes, baseEdges, direction).nodes;
    }
    return baseNodes;
  }, [layout, baseNodes, baseEdges, direction, layer, simData.nodes, showOtherDomain]);

  const normalizedSearch = (searchTerm ?? "").toLowerCase();

  const coloredNodes = useMemo(
    () =>
      laidOutNodes.map((n) => {
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
          (meta?.label?.toLowerCase().includes(normalizedSearch) ||
            meta?.domain?.toLowerCase().includes(normalizedSearch));
        const baseBorder = "#e2e8f0";
        const highlightBorder = "#cbd5e1";
        const useColor = layer === "stack" || layer === "integration" ? baseBorder : color;
        const shadowColor = layer === "stack" || layer === "integration" ? "rgba(15,23,42,0.06)" : `${color}33`;
        return {
          ...n,
          style: {
            ...n.style,
            border: isSelected || matchesSearch ? `2px solid ${highlightBorder}` : `1px solid ${useColor}`,
            boxShadow: isSelected || matchesSearch ? `0 4px 12px ${shadowColor}` : `0 2px 8px ${shadowColor}`,
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
      }),
    [laidOutNodes, simData.nodes, domainColors, layer, selectedNodeId, normalizedSearch],
  );

  const onNodeClick = (_: any, node: Node) => {
    if (state.mode === "simulate") {
      toggleNode(node.id);
      return;
    }
    if (onSelectNode) {
      onSelectNode(node.id);
    }
  };

  React.useEffect(() => {
    if (flowInstance && coloredNodes.length > 0) {
      // Defer to next frame to ensure nodes are mounted
      requestAnimationFrame(() => {
        flowInstance.fitView({ padding: 0.3 });
      });
    }
  }, [flowInstance, coloredNodes.length, layout, direction, layer, showOtherDomain]);

  const styledEdges = baseEdges.map((e) => {
    const stroke = edgeKindColor((e as any).data?.kind);
    const baseWidth = layer === "integration" ? 2 : 1.6;
    return {
      ...e,
      type: "straight",
      style: {
        ...(e.style || {}),
        strokeWidth: baseWidth,
        stroke,
        opacity: 0.8,
        strokeDasharray: "5 4",
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
      },
    };
  });

  const visibleNodes = useMemo(() => {
    if (layer !== "domain") return coloredNodes;
    return coloredNodes.filter((n) => {
      const meta = (n.data as any)?.meta;
      const domain = normalizeDomainValue(meta?.domain);
      if (!showOtherDomain && domain === "Other") return false;
      if (hiddenDomains.has(domain)) return false;
      return true;
    });
  }, [coloredNodes, layer, showOtherDomain, hiddenDomains]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () => styledEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [styledEdges, visibleNodeIds],
  );

  const btnBase =
    "rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";

  // Track viewport transform so domain overlays move with pan/zoom.
  const [tx, ty, tz] = transform;

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

        {layout === "dagre" && (
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            <button
              onClick={() => setDirection("TB")}
              aria-label="Top-down layout"
              className={`${btnBase} ${
                direction === "TB" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setDirection("LR")}
              aria-label="Left-right layout"
              className={`${btnBase} ${
                direction === "LR" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Horizontal
            </button>
          </div>
        )}

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
            <button
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setShowDomainLegend((v) => !v)}
            >
              Domains ({domainColors.size}) ▾
            </button>
            {showDomainLegend && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                {[...domainColors.entries()].map(([name, c]) => {
                  const hidden = hiddenDomains.has(name);
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        const next = new Set(hiddenDomains);
                        if (hidden) next.delete(name);
                        else next.add(name);
                        setHiddenDomains(next);
                      }}
                      className={
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " +
                        (hidden
                          ? "border-slate-200 bg-white text-slate-400"
                          : "border-slate-200 bg-white text-slate-800")
                      }
                    >
                      <span className="fx-legend-dot" style={{ backgroundColor: c }} />
                      {name}
                      {hidden ? " (hidden)" : ""}
                    </button>
                  );
                })}
              </div>
            )}
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

      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm relative overflow-hidden" style={{ height }}>
        {layer === "domain" && domainBoxes.length > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${tx}px, ${ty}px) scale(${tz})`,
              transformOrigin: "0 0",
            }}
          >
            {domainBoxes.map((box, idx) => (
              <div
                key={box.label + idx}
                className="absolute rounded-2xl border border-slate-200/70 bg-slate-50/40"
                style={{
                  left: box.x,
                  width: box.width,
                  height: box.height,
                  top: 8,
                }}
              >
                <div className="absolute -top-3 left-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm">
                  {box.label}
                </div>
              </div>
            ))}
          </div>
        )}
        <ReactFlow
          onInit={(inst) => setFlowInstance(inst)}
          onMove={(_, vp: Viewport) => setTransform([vp.x, vp.y, vp.zoom])}
          nodesDraggable={layer !== "domain"}
          nodesConnectable={layer !== "domain"}
          elementsSelectable={layer !== "domain"}
          nodes={
            layout === "dagre"
              ? visibleNodes.map((n) => {
                  const mapped = laidOutNodes.find((ln) => ln.id === n.id);
                  return { ...n, position: mapped?.position ?? n.position };
                })
              : visibleNodes
          }
          edges={visibleEdges}
          onNodeClick={onNodeClick}
          fitView
          defaultEdgeOptions={{ type: "straight" }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      </div>
    </div>
  );
}
