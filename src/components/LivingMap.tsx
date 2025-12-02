"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  OnInit,
  Viewport,
  type ReactFlowInstance,
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
  const { data: simData, state, toggleNode } = useSimulationEngine(data);
  const [layer, setLayer] = useState<LayerMode>("domain");
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showOtherDomain, setShowOtherDomain] = useState<boolean>(true);
  const [transform, setTransform] = useState<[number, number, number]>([0, 0, 1]);
  const [showDomainLegend, setShowDomainLegend] = useState<boolean>(false);
  const [hiddenDomains, setHiddenDomains] = useState<Set<string>>(new Set());
  const [focusDomain, setFocusDomain] = useState<string | null>(null);
  const [crossDomainOnly, setCrossDomainOnly] = useState<boolean>(true);
  const [edgeFilter, setEdgeFilter] = useState<"all" | "derived" | "inferred" | "unresolved" | "placeholder">("all");
  const [hideIsolates, setHideIsolates] = useState<boolean>(true);

  React.useEffect(() => {
    const handler = () => setShowOtherDomain((prev) => !prev);
    window.addEventListener("livingmap:toggle-other", handler);
    return () => window.removeEventListener("livingmap:toggle-other", handler);
  }, []);

  const metaById = useMemo(() => {
    const map = new Map<string, any>();
    simData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [simData.nodes]);

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
        const meta = metaById.get(n.id) ?? n;
        const domainKey = normalizeDomainValue((meta as any).domain);
        const upstreamIds = neighbors.up.get(n.id) ?? new Set();
        const downstreamIds = neighbors.down.get(n.id) ?? new Set();
        const upstreamLabels = Array.from(upstreamIds).map((id) => labelById.get(id) ?? id);
        const downstreamLabels = Array.from(downstreamIds).map((id) => labelById.get(id) ?? id);
        const upstreamCount = upstreamIds.size;
        const downstreamCount = downstreamIds.size;
        const tooltipParts = [
          meta.disposition ? `Disposition: ${meta.disposition}` : null,
          Number.isFinite(meta.aiReadiness) ? `AI Readiness: ${Math.round(meta.aiReadiness)}%` : null,
          Number.isFinite(meta.opportunityScore ?? meta.roiScore)
            ? `Opportunity: ${Math.round(meta.opportunityScore ?? meta.roiScore)}%`
            : null,
          upstreamLabels.length ? `Upstream: ${upstreamLabels.join(", ")}` : null,
          downstreamLabels.length ? `Downstream: ${downstreamLabels.join(", ")}` : null,
        ]
          .filter(Boolean)
          .join(" • ");

        return {
          id: n.id,
          data: {
            label: (
              <div title={tooltipParts || undefined}>
                <div className="text-xs font-semibold text-slate-900">{n.label}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                    ↑ {upstreamCount}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                    ↓ {downstreamCount}
                  </span>
                </div>
              </div>
            ),
            meta,
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
    [simData.nodes, state.mode, labelById, neighbors.up, neighbors.down, metaById],
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

  const rawEdges: Edge[] = useMemo(
    () =>
      simData.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: { kind: e.kind, edgeType: (e as any).edgeType, inferred: (e as any).inferred, confidence: (e as any).confidence },
      })),
    [simData.edges],
  );

  const domainLayout = useMemo(() => {
    if (layer !== "domain") return { nodes: baseNodes, boxes: [] as Array<{ label: string; x: number; width: number; height: number }> };
    const domains = Array.from(
      new Set(
        baseNodes
          .map((n) => {
            const meta = metaById.get(n.id);
            const norm = normalizeDomainValue(meta?.domain);
            if ((!showOtherDomain && norm === "Other") || hiddenDomains.has(norm)) return null;
            return norm;
          })
          .filter(Boolean),
      ),
    ).sort();
    const domainIndex = new Map<string, number>();
    domains.forEach((d, idx) => domainIndex.set(d || "Other", idx));

    const hGap = 260;
    const vGap = 140;
    const maxRows = 12;
    const counts: Record<string, number> = {};

    const boxes = domains.map((d, idx) => {
      const isFocus = focusDomain === d || !focusDomain;
      return {
        label: d,
        x: idx * hGap - 20,
        width: hGap - 40,
        height: isFocus ? 1600 : 1200,
      };
    });

    const laidOut = baseNodes
      .map((n) => {
        const meta = metaById.get(n.id);
        const domain = normalizeDomainValue(meta?.domain);
        if ((!showOtherDomain && domain === "Other") || hiddenDomains.has(domain)) return null;
        if (focusDomain && domain !== focusDomain) return null;
        const col = domainIndex.get(domain) ?? 0;
        counts[domain] = (counts[domain] ?? 0) + 1;
        const row = (counts[domain] - 1) % maxRows;
        const rowBlock = Math.floor((counts[domain] - 1) / maxRows);
        return {
          ...n,
          position: {
            x: col * hGap + rowBlock * 40,
            y: 80 + row * vGap,
          },
        };
      })
      .filter(Boolean) as Node[];

    return { nodes: laidOut, boxes };
  }, [layer, baseNodes, metaById, showOtherDomain, hiddenDomains, focusDomain]);

  const dagreNodes = useMemo(
    () => applyDagreLayout(baseNodes, rawEdges, "TB").nodes,
    [baseNodes, rawEdges],
  );

  const laidOutNodes = layer === "domain" ? domainLayout.nodes : dagreNodes;
  const domainBoxes = domainLayout.boxes;

  const normalizedSearch = (searchTerm ?? "").toLowerCase();

  const coloredNodes = useMemo(() => {
    return laidOutNodes.map((n) => {
      const meta = metaById.get(n.id);
      const healthScore = meta?.health ?? 60;
      const aiScore = meta?.aiReadiness ?? 55;
      const roiScore = meta?.roiScore ?? aiScore;
      const domainColor = domainColors.get(meta?.domain ?? "Other") ?? COLORS.neutral;
      const dispositionKey = meta?.disposition as keyof typeof COLORS.disposition | undefined;
      const dispositionColor = dispositionKey ? COLORS.disposition[dispositionKey] ?? COLORS.neutral : COLORS.neutral;

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
    });
  }, [laidOutNodes, metaById, domainColors, layer, selectedNodeId, normalizedSearch]);

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
    if (flowInstance && typeof flowInstance.fitView === "function" && coloredNodes.length > 0) {
      // Defer to next frame to ensure nodes are mounted
      requestAnimationFrame(() => {
        flowInstance.fitView({ padding: 0.3 });
      });
    }
  }, [flowInstance, coloredNodes.length]);

  const styledEdges = useMemo(() => rawEdges.map((e: any) => {
    const confidence = typeof e?.confidence === "number" ? e.confidence : (e.data?.confidence as number) ?? 0.6;
    const kind =
      (e.data?.edgeType as any) ??
      (e.data?.inferred || e.inferred ? "inferred" : confidence < 0.4 ? "unresolved" : "derived");
    const stroke =
      kind === "derived"
        ? "#2563EB"
        : kind === "inferred"
        ? "#A855F7"
        : kind === "unresolved"
        ? "#FB923C"
        : "#374151";
    const dash =
      kind === "derived"
        ? undefined
        : kind === "inferred"
        ? "5 4"
        : kind === "unresolved"
        ? "2 4"
        : "2 6";
    const baseWidth = layer === "integration" ? 2 : 1.6;
    return {
      ...e,
      confidence,
      data: { ...(e.data || {}), edgeType: kind, confidence },
      type: "smoothstep",
      style: {
        ...(e.style || {}),
        strokeWidth: baseWidth,
        stroke,
        opacity: 0.8,
        strokeDasharray: dash,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
      },
    };
  }), [rawEdges, layer]);

  // First pass: domain visibility only (no isolate filter yet)
  const domainFilteredNodes = useMemo(() => {
    if (layer !== "domain") return coloredNodes;
    return coloredNodes.filter((n) => {
      const meta = (n.data as any)?.meta;
      const domain = normalizeDomainValue(meta?.domain);
      if (!showOtherDomain && domain === "Other") return false;
      if (hiddenDomains.has(domain)) return false;
      return true;
    });
  }, [coloredNodes, layer, showOtherDomain, hiddenDomains]);

  const domainByNode = useMemo(() => {
    const map = new Map<string, string>();
    simData.nodes.forEach((n) => map.set(n.id, normalizeDomainValue((n as any).domain)));
    return map;
  }, [simData.nodes]);

  const domainFilteredIds = useMemo(() => new Set(domainFilteredNodes.map((n) => n.id)), [domainFilteredNodes]);

  const visibleEdges = useMemo(() => {
    return styledEdges.filter((e: any) => {
      if (!domainFilteredIds.has(e.source) || !domainFilteredIds.has(e.target)) return false;
      if (edgeFilter !== "all" && (e.data?.edgeType as any) !== edgeFilter) return false;
      if (layer === "domain" && crossDomainOnly) {
        const srcDom = domainByNode.get(e.source);
        const tgtDom = domainByNode.get(e.target);
        if (!srcDom || !tgtDom) return false;
        if (srcDom === tgtDom) return false;
      }
      return true;
    });
  }, [styledEdges, domainFilteredIds, layer, crossDomainOnly, domainByNode, edgeFilter]);

  const degreeByNode = useMemo(() => {
    const deg = new Map<string, number>();
    visibleEdges.forEach((e) => {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    });
    return deg;
  }, [visibleEdges]);

  const visibleNodes = useMemo(() => {
    const base = layer !== "domain" ? coloredNodes : domainFilteredNodes;
    if (!hideIsolates) return base;
    return base.filter((n) => (degreeByNode.get(n.id) ?? 0) > 0);
  }, [coloredNodes, domainFilteredNodes, hideIsolates, degreeByNode, layer]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);
  const laidOutById = useMemo(() => {
    const map = new Map<string, Node>();
    (laidOutNodes as Node[]).forEach((n) => map.set(n.id, n));
    return map;
  }, [laidOutNodes]);

  const positionedNodes = useMemo(
    () =>
      visibleNodes.map((n) => {
        const mapped = laidOutById.get(n.id);
        return { ...n, position: mapped?.position ?? n.position };
      }),
    [visibleNodes, laidOutById],
  );

  const visibleDomains = useMemo(() => {
    const set = new Set<string>();
    visibleNodes.forEach((n) => {
      const meta = (n.data as any)?.meta;
      const domain = normalizeDomainValue(meta?.domain);
      if (domain) set.add(domain);
    });
    return set;
  }, [visibleNodes]);

  const btnBase =
    "rounded-full px-3 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300";

  // Track viewport transform so domain overlays move with pan/zoom.
  const [tx, ty, tz] = transform;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
          {([
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
        {layer === "domain" && (
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            <button
              onClick={() => setCrossDomainOnly((v) => !v)}
              aria-label="Toggle cross-domain edges"
              className={`${btnBase} ${crossDomainOnly ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              Cross-domain only
            </button>
            <button
              onClick={() => setFocusDomain(null)}
              aria-label="Show all domains"
              className={`${btnBase} ${!focusDomain ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              All domains
            </button>
            <button
              onClick={() => setHideIsolates((v) => !v)}
              aria-label="Toggle isolates"
              className={`${btnBase} ${hideIsolates ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              {hideIsolates ? "Hide isolates" : "Show isolates"}
            </button>
          </div>
        )}
        {(layer === "domain" || layer === "integration") && (
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            {(["all", "derived", "inferred", "unresolved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setEdgeFilter(f)}
                aria-label={`Show ${f} edges`}
                className={`${btnBase} ${
                  edgeFilter === f ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "All edges" : f}
              </button>
            ))}
          </div>
        )}
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
            {domainBoxes
              .filter((box) => box.label && visibleDomains.has(box.label))
              .map((box, idx) => (
              <div
                key={`${box.label ?? "domain"}-${idx}`}
                className="absolute rounded-2xl border border-slate-200/70 bg-slate-50/40"
                style={{
                  left: box.x,
                  width: box.width,
                  height: box.height,
                  top: 8,
                }}
              >
                <div className="absolute -top-3 left-3 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-sm">
                  {box.label ?? "Other"}
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
          nodes={positionedNodes as Node[]}
          edges={visibleEdges}
          fitView
          defaultEdgeOptions={{ type: "straight" }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-[11px] text-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#2563EB" }} />
              Derived
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#A855F7" }} />
              Inferred
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: "#FB923C" }} />
              Unresolved
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">Shift+click to lock focus; toggle edge filters above.</div>
        </div>
      </div>
    </div>
  );
}
