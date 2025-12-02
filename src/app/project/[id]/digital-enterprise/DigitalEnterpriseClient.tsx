"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import {
  SystemImpactPanel,
  type SystemImpact,
} from "@/components/digital-enterprise/SystemImpactPanel";
import { CytoMap } from "@/components/CytoMap";
import type { LivingMapData, LivingNode, LivingEdge } from "@/types/livingMap";
import { useROISimulation } from "@/hooks/useROISimulation";
import { ROIChart } from "@/components/ROIChart";
import { EventLogPanel } from "@/components/EventLogPanel";
import { useAIInsights } from "@/hooks/useAIInsights";
import { NodeInsightPanel } from "@/components/NodeInsightPanel";
import { ScenarioComparePanel } from "@/components/ScenarioComparePanel";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useAdaptiveUIState } from "@/hooks/useAdaptiveUIState";
import { Card } from "@/components/ui/Card";
import { useSimplificationMetrics } from "@/hooks/useSimplificationMetrics";

interface TopSystemRaw {
  systemId?: string;
  id?: string;
  systemName?: string;
  name?: string;
  label?: string;
  integrationCount?: number;
  integrations?: number;
  degree?: number;
}

interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
  topSystems: TopSystemRaw[];
}

interface Props {
  projectId: string;
}

function resolveSystemName(s: TopSystemRaw): string {
  return (
    s.systemName ||
    s.name ||
    s.label ||
    s.id ||
    s.systemId ||
    "Unknown"
  );
}

function resolveIntegrationCount(s: TopSystemRaw): number {
  return (
    s.integrationCount ??
    s.integrations ??
    s.degree ??
    0
  );
}

function formatNumber(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

function stableScore(id: string, base: number, spread: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // force 32-bit
  }
  const normalized = Math.abs(hash % 1000) / 1000; // 0..0.999
  return base + normalized * spread;
}

function buildLivingMapData(view: { nodes?: any[]; edges?: any[] }): LivingMapData {
  const nodes = Array.isArray(view.nodes) ? view.nodes : [];
  const edges = Array.isArray(view.edges) ? view.edges : [];
  const degree = new Map<string, number>();
  edges.forEach((e: any) => {
    const src = e?.sourceId ?? e?.source;
    const tgt = e?.targetId ?? e?.target;
    if (src) degree.set(src, (degree.get(src) ?? 0) + 1);
    if (tgt) degree.set(tgt, (degree.get(tgt) ?? 0) + 1);
  });

  const livingNodes: LivingMapData["nodes"] = nodes.map((n: any) => {
    const id = String(n?.id ?? "");
    const label = String(n?.label ?? n?.name ?? "Unknown");
    const domain = n?.domain ?? null;
    const integrationCount = degree.get(id) ?? 0;
    return {
      id,
      label,
      domain,
      integrationCount,
      state: (n as any).state,
      health: stableScore(id, 55, 35),
      aiReadiness: stableScore(id + "-ai", 45, 45),
      roiScore: stableScore(id + "-roi", 35, 50),
    };
  });

  const livingEdges: LivingMapData["edges"] = edges.map((e: any, idx: number) => ({
    id: String(e?.id ?? `edge-${idx}`),
    source: String(e?.sourceId ?? e?.source ?? ""),
    target: String(e?.targetId ?? e?.target ?? ""),
    weight: 1,
    kind: "api",
    confidence: typeof e?.confidence === "number" ? e.confidence : undefined,
    inferred: Boolean(e?.data?.inferred || e?.inferred),
    state: (e as any).state,
  }));

  return { nodes: livingNodes, edges: livingEdges };
}

export function DigitalEnterpriseClient({ projectId }: Props) {
  const telemetry = useTelemetry("digital_enterprise", { projectId });
  const { snapshot, setMetrics } = useSimplificationMetrics("digital_enterprise");
  const {
    showContextBar,
    contextMessage,
    setContextMessage,
    assistVisible,
    assistMessage,
    setAssistMessage,
    setAssistVisible,
    ctaEnabled,
    setCtaEnabled,
    ctaLabel,
    setCtaLabel,
    progress,
    setProgress,
  } = useAdaptiveUIState("digital_enterprise", {
    initialContext: "Explore domains → systems → integrations as data arrives.",
    initialCTA: "Run AI analysis",
    initialProgress: 0.25,
  });
  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [graphDepth, setGraphDepth] = useState<"domains" | "systems" | "integrations">("domains");
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const retryAfterRef = useRef<number>(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const devLoadOnceRef = useRef(false);
  const simplificationScoreRef = useRef(0);
  const prevUiRef = useRef<{
    progress: number;
    ctaEnabled: boolean;
    context: string;
    ctaLabel: string;
  }>({
    progress: 0.25,
    ctaEnabled: false,
    context: "",
    ctaLabel: "Run AI analysis",
  });
  const [graphEnabled, setGraphEnabled] = useState(false);
  const prevMetricsRef = useRef<{ DC: number; CL: number }>({
    DC: snapshot?.metrics?.DC ?? 0.55,
    CL: snapshot?.metrics?.CL ?? 0.7,
  });
  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(true);
  const [graphError, setGraphError] = useState<string | null>(null);
  const timelineStages = useMemo(() => ["Current", "Stage 1", "Future"], []);
  const [timelineStage, setTimelineStage] = useState<number>(0);
  const [overlays, setOverlays] = useState({
    roi: true,
    cost: false,
    risk: false,
    modernization: false,
  });
  const [showUnchanged, setShowUnchanged] = useState<boolean>(false);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());
  const [visibleEdgeIds, setVisibleEdgeIds] = useState<Set<string>>(new Set());

  const [impact, setImpact] = useState<SystemImpact | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const aiInsights = useAIInsights(graphData?.nodes ?? []);
  const livingMapData = useMemo<LivingMapData>(() => {
    const data = graphData ?? { nodes: [], edges: [] };
    const safeNodes = ((data.nodes ?? []) as LivingNode[]).filter((n): n is LivingNode => !!n);
    const dispositions: Array<NonNullable<LivingMapData["nodes"][number]["disposition"]>> = [
      "keep",
      "modernize",
      "replace",
      "retire",
    ];
    const enrichedNodes = safeNodes
      .map((n, idx) => {
        const labelRaw = (n as any).system_name ?? (n as any).label ?? "";
        const label = labelRaw || String(n.id ?? "Unknown");
        if (!n.id || !label) return null;
        const insight = aiInsights.insights[n.id];
        return {
          ...n,
          id: String(n.id),
          label,
          domain: insight?.domain ?? n.domain,
          aiReadiness: insight?.aiReadiness ?? n.aiReadiness,
          opportunityScore: insight?.opportunityScore ?? n.opportunityScore,
          riskScore: insight?.riskScore ?? n.riskScore,
          roiScore: n.roiScore ?? n.opportunityScore,
          aiSummary: insight?.summary ?? n.aiSummary,
          disposition: (insight?.disposition as any) ?? n.disposition ?? dispositions[idx % dispositions.length],
        };
      })
      .filter(Boolean) as LivingNode[];

    return {
      nodes: enrichedNodes,
      edges: ((data.edges ?? []) as LivingEdge[]).filter((e): e is LivingEdge => !!e && !!(e as any).source && !!(e as any).target),
    };
  }, [graphData, aiInsights.insights]);

  const stageSnapshots = useMemo(() => {
    const currentNodes = livingMapData.nodes.filter((n: any) => n.state !== "added");
    const futureNodes = livingMapData.nodes.filter((n: any) => n.state !== "removed");
    const deltaNodes = livingMapData.nodes.filter((n: any) =>
      ["added", "removed", "modified"].includes((n as any).state ?? ""),
    );
    const stage1Nodes = deltaNodes.length ? deltaNodes : futureNodes;
    const toSet = (nodesArr: LivingNode[]) => new Set(nodesArr.map((n) => n.id));
    const currentKeep = toSet(currentNodes);
    const futureKeep = toSet(futureNodes);
    const stage1Keep = toSet(stage1Nodes);
    const edgeFilter = (keep: Set<string>) =>
      livingMapData.edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    return {
      current: { nodes: currentNodes, edges: edgeFilter(currentKeep) },
      stage1: { nodes: stage1Nodes, edges: edgeFilter(stage1Keep) },
      future: { nodes: futureNodes, edges: edgeFilter(futureKeep) },
    };
  }, [livingMapData]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === "true") {
      // eslint-disable-next-line no-console
      console.log("[DE] harmonized graph", {
        nodes: livingMapData.nodes.length,
        edges: livingMapData.edges.length,
        sample: livingMapData.nodes.slice(0, 3).map((n) => ({ id: n.id, label: n.label, domain: (n as any).domain })),
      });
    }
  }, [livingMapData]);

  const roiSim = useROISimulation();
  const simplificationScore = Math.min(
    1,
    Math.max(0, (snapshot?.metrics?.SSS ?? 2.4) / 5),
  );
  const simplificationLabel =
    simplificationScore >= 0.8
      ? "Clean graph"
      : simplificationScore >= 0.5
      ? "Mostly aligned"
      : "Needs clarity";
  const simplificationTone =
    simplificationScore >= 0.8
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : simplificationScore >= 0.5
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-rose-50 text-rose-700 border-rose-200";
  useEffect(() => {
    simplificationScoreRef.current = simplificationScore;
  }, [simplificationScore]);

  const loadStats = useCallback(
    async (opts?: { allowDuplicate?: boolean; source?: "auto" | "retry" | "manual" }) => {
      if (process.env.NODE_ENV === "development" && !opts?.allowDuplicate) {
        if (devLoadOnceRef.current) return;
        devLoadOnceRef.current = true;
      }

      const now = Date.now();
      if (now < retryAfterRef.current && !opts?.allowDuplicate) {
        return;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    const started = performance.now();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const logFn = res.status === 429 ? console.warn : console.error;
        logFn("[DE-PAGE] Failed to load stats", res.status, text);
        if (res.status === 429) {
          let retryAfterMs = 60000;
          try {
            const parsed = JSON.parse(text);
            if (parsed?.retryAfterMs) {
              retryAfterMs = Number(parsed.retryAfterMs) || retryAfterMs;
            }
          } catch {
            // ignore JSON parse errors
          }
          retryAfterRef.current = Date.now() + retryAfterMs;
          setError(`Rate limited. Retrying in ${Math.round(retryAfterMs / 1000)}s.`);
          retryTimeoutRef.current = setTimeout(() => {
            loadStats({ allowDuplicate: true, source: "retry" });
          }, retryAfterMs);
        } else {
          setError("Failed to load digital enterprise metrics.");
        }
        setStats(null);
        telemetry.log(
          "graph_load_error",
          {
            status: res.status,
            body: text,
          },
          simplificationScoreRef.current,
        );
        return;
      }

      const json = (await res.json()) as DigitalEnterpriseStats;
      setStats(json);
      setError(null);
      telemetry.log(
        "graph_load",
        {
          systems: json.systemsFuture,
          integrations: json.integrationsFuture,
          domains: json.domainsDetected,
          duration_ms: Math.round(performance.now() - started),
        },
        simplificationScoreRef.current,
      );
    } catch (err: any) {
      console.error("[DE-PAGE] Error loading stats", err);
      setError("Failed to load digital enterprise metrics.");
      setStats(null);
      telemetry.log(
        "graph_load_error",
        { message: (err as Error)?.message },
        simplificationScoreRef.current,
      );
    } finally {
      setLoading(false);
    }
    },
    [projectId, telemetry],
  );

  useEffect(() => {
    telemetry.log("workspace_view", { projectId }, simplificationScoreRef.current);
    loadStats();
  }, [projectId, telemetry, loadStats]);

  const loadGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(null);
    try {
      const res = await fetch(
        `/api/digital-enterprise/view?project=${encodeURIComponent(projectId)}&mode=all`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`View load failed ${res.status}: ${text}`);
      }
      const json = await res.json();
      const next = buildLivingMapData(json);
      setGraphData(next);
      setGraphEnabled(true);
    } catch (err: any) {
      setGraphError(err?.message ?? "Failed to load graph data.");
      setGraphData(null);
      setGraphEnabled(false);
    } finally {
      setGraphLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!stats) return;
    const denseGraph =
      (stats.systemsFuture ?? 0) > 50 || (stats.integrationsFuture ?? 0) > 80;
    if (autoCollapsed !== denseGraph) {
      setAutoCollapsed(denseGraph);
    }
    const nextDepth: "domains" | "systems" = denseGraph ? "domains" : "systems";
    if (graphDepth !== nextDepth) {
      setGraphDepth(nextDepth);
    }
    const loadFactor = Math.min(
      1,
      ((stats.systemsFuture ?? 0) + (stats.integrationsFuture ?? 0)) / 800,
    );
    const nextMetrics = {
      DC: 0.55 + loadFactor * 0.35,
      CL: 0.7 - loadFactor * 0.2,
    };
    const prev = prevMetricsRef.current;
    const dcDelta = Math.abs((prev.DC ?? 0) - nextMetrics.DC);
    const clDelta = Math.abs((prev.CL ?? 0) - nextMetrics.CL);
    if (dcDelta > 0.001 || clDelta > 0.001) {
      prevMetricsRef.current = nextMetrics;
      setMetrics(nextMetrics);
    }
  }, [stats, autoCollapsed, graphDepth, setMetrics]);


  const hasDataFromStats =
    !!stats &&
    ((stats.systemsFuture ?? 0) > 0 ||
      (stats.integrationsFuture ?? 0) > 0);
  const hasGraphData = (graphData?.nodes?.length ?? 0) > 0;
  const hasData = hasDataFromStats || hasGraphData;
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (livingMapData.nodes ?? []).forEach((n: any) => {
      const d = (n.domain as string) || "Other";
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return counts;
  }, [livingMapData.nodes]);

  const stageSnapshotForIndex = useMemo(() => {
    const map: Record<number, { nodes: LivingNode[]; edges: LivingEdge[] }> = {
      0: stageSnapshots.current,
      [timelineStages.length - 1]: stageSnapshots.future,
    };
    if (timelineStages.length > 2) {
      map[1] = stageSnapshots.stage1;
    }
    return map;
  }, [stageSnapshots, timelineStages.length]);

  const displayData = useMemo<LivingMapData>(() => {
    const snap = stageSnapshotForIndex[timelineStage];
    if (snap && snap.nodes.length > 0) {
      return { nodes: snap.nodes, edges: snap.edges };
    }
    // Fallback to full graph to avoid blank states.
    return livingMapData;
  }, [livingMapData, stageSnapshotForIndex, timelineStage]);

  useEffect(() => {
    const snap = stageSnapshotForIndex[timelineStage];
    if (snap && snap.nodes.length) {
      setVisibleNodeIds(new Set(snap.nodes.map((n) => n.id)));
      setVisibleEdgeIds(new Set(snap.edges.map((e) => e.id)));
    } else {
      setVisibleNodeIds(new Set(livingMapData.nodes.map((n) => n.id)));
      setVisibleEdgeIds(new Set(livingMapData.edges.map((e) => e.id)));
    }
  }, [livingMapData, stageSnapshotForIndex, timelineStage]);

  const selectedNode = useMemo(
    () => displayData.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [displayData.nodes, selectedNodeId]
  );

  useEffect(() => {
    const baseProgress = hasData ? 0.65 : 0.35;
    const depthBonus = selectedNodeId ? 0.9 : baseProgress;
    const nextContext = hasData
      ? "Graph loaded — drill into systems or run AI analysis."
      : "Load Lucid data on Tech Stack to populate this view.";
    const nextLabel = hasData ? "Run AI analysis" : "Awaiting Lucid data";

    const prev = prevUiRef.current;
    const progressChanged = Math.abs(prev.progress - depthBonus) > 0.001;
    const ctaChanged = prev.ctaEnabled !== hasData || prev.ctaLabel !== nextLabel;
    const contextChanged = prev.context !== nextContext;

    if (progressChanged) {
      prevUiRef.current.progress = depthBonus;
      setProgress(depthBonus);
    }
    if (ctaChanged) {
      prevUiRef.current.ctaEnabled = hasData;
      prevUiRef.current.ctaLabel = nextLabel;
      setCtaEnabled(hasData);
      setCtaLabel(nextLabel);
    }
    if (contextChanged) {
      prevUiRef.current.context = nextContext;
      setContextMessage(nextContext);
    }
  }, [
    hasData,
    selectedNodeId,
    setContextMessage,
    setCtaEnabled,
    setCtaLabel,
    setProgress,
  ]);

  useEffect(() => {
    if (error) {
      setAssistVisible(true);
      setAssistMessage(error);
      return;
    }
    if (autoCollapsed) {
      setAssistVisible(true);
      setAssistMessage(
        "Dense graph detected — defaulting to domain view. Expand layers as needed.",
      );
      return;
    }
    setAssistVisible(false);
    setAssistMessage(null);
  }, [autoCollapsed, error, setAssistMessage, setAssistVisible]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAssistVisible(true);
      setAssistMessage("Explore nodes or run AI analysis to trace integrations.");
      telemetry.log(
        "digital_enterprise_idle",
        { idle_ms: 45000, hasData },
        simplificationScoreRef.current,
      );
    }, 45000);
    return () => window.clearTimeout(timer);
  }, [
    hasData,
    selectedNodeId,
    search,
    telemetry,
    setAssistMessage,
    setAssistVisible,
  ]);

  function handleSelectSystem(name: string, degree: number) {
    // For now, we mock upstream/downstream split.
    // Backend traversal will replace this logic later.
    const upstreamCount = Math.max(0, Math.floor(degree / 2));
    const downstreamCount = Math.max(0, degree - upstreamCount);
    telemetry.log("node_click", { name, degree }, simplificationScoreRef.current);
    telemetry.log(
      "edge_trace",
      { name, degree, upstreamCount, downstreamCount },
      simplificationScoreRef.current,
    );

    setImpact({
      systemName: name,
      totalDegree: degree,
      upstreamCount,
      downstreamCount,
      upstream: [],
      downstream: [],
    });
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {error && (
        <div className="mb-4">
          <ErrorBanner
            message={error}
            onRetry={() => loadStats({ allowDuplicate: true, source: "manual" })}
          />
        </div>
      )}
      <WorkspaceHeader
        statusLabel="DIGITAL ENTERPRISE"
        title={`Ecosystem View for Project: ${projectId || "(unknown)"}`}
        description="These metrics are derived directly from your Lucid architecture diagram. We count unique systems that participate in at least one connection and their integrations."
      />
      {showContextBar && (
        <Card className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.65rem] tracking-[0.22em] text-slate-500 uppercase mb-1">
              CONTEXT
            </p>
            <p className="text-xs text-slate-700">
              {contextMessage || "Adaptive guidance will respond as telemetry arrives."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-2 w-36 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="text-[0.75rem] font-semibold text-slate-800">
              {Math.round(progress * 100)}%
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-semibold ${simplificationTone}`}
            >
              {Math.round(simplificationScore * 100)}% · {simplificationLabel}
            </span>
            <button
              type="button"
              disabled={!ctaEnabled}
              onClick={() => {
                telemetry.log(
                  "ai_analysis_cta",
                  { projectId, hasData },
                  simplificationScoreRef.current,
                );
                setGraphDepth("systems");
              }}
              className={
                "rounded-full px-4 py-1.5 text-[0.75rem] font-semibold " +
                (ctaEnabled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed")
              }
            >
              {ctaLabel}
            </button>
          </div>
        </Card>
      )}

      {assistVisible && assistMessage && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-[0.65rem] tracking-[0.22em] text-amber-700 uppercase mb-1">
            NEXT STEP
          </p>
          <p className="text-xs text-amber-800">{assistMessage}</p>
        </Card>
      )}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <p className="text-[0.7rem] text-slate-500">Layer view:</p>
            {(["domains", "systems", "integrations"] as const).map((depth) => (
              <button
                key={depth}
                type="button"
                onClick={() => setGraphDepth(depth)}
                className={
                  "rounded-full border px-3 py-1 text-[0.7rem] font-semibold " +
                  (graphDepth === depth
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-100 text-slate-700 border-slate-200")
                }
              >
                {depth === "domains"
                  ? "Domains"
                  : depth === "systems"
                  ? "Systems"
                  : "Integrations"}
              </button>
            ))}
            {autoCollapsed && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[0.7rem] font-medium text-amber-800">
                Dense graph — domains collapsed
              </span>
            )}
          </div>

      {loading && (
        <div className="mt-10 text-sm text-gray-500">
          Loading digital enterprise metrics…
        </div>
      )}

      {!loading && error && (
        <div className="mt-10 text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && hasData && stats && (
        <>
          {/* Metric cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            <MetricCard
              label="SYSTEMS"
              value={formatNumber(stats.systemsFuture)}
              description="Unique labeled systems that participate in at least one connection in this architecture view."
            />
            <MetricCard
              label="INTEGRATIONS"
              value={formatNumber(stats.integrationsFuture)}
              description="Unique system-to-system connections derived from connector lines."
            />
            <MetricCard
              label="DOMAINS DETECTED"
              value={formatNumber(stats.domainsDetected ?? 0)}
              description="Domain / ecosystem clustering will evolve in a later pass."
            />
          </section>

          {/* Top systems table */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold mb-1">LIVING MAP (BETA)</h2>
          <p className="text-xs text-gray-500 mb-4">
            Interactive upstream/downstream view; simulate and color by health/AI readiness/redundancy.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold">Search</span>
              <input
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
                placeholder="System or domain"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Edge kinds:</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#2563eb" }} />API</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#22c55e" }} />Data</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#9333ea" }} />Workflow</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#94a3b8" }} />Manual/Other</span>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Overlays:</span>
            {(["roi", "cost", "risk", "modernization"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setOverlays((prev) => {
                    const next = { ...prev, [key]: !prev[key] };
                    telemetry.log(
                      "overlay_active",
                      { overlay: key, active: next[key] },
                      simplificationScoreRef.current,
                    );
                    return next;
                  });
                }}
                className={`rounded-full border px-3 py-1 font-semibold ${
                  overlays[key] ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                {key === "roi" ? "ROI" : key === "cost" ? "Cost" : key === "risk" ? "Risk" : "Modernization"}
              </button>
            ))}
            <span className="text-slate-400">(decorative until overlays wired)</span>
          </div>
          {graphError && (
            <Card className="mb-3 border-rose-200 bg-rose-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] tracking-[0.22em] text-rose-700 uppercase mb-1">
                    GRAPH LOAD ERROR
                  </p>
                  <p className="text-xs text-rose-800">
                    {graphError || "Failed to load Digital Enterprise graph."}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={() => {
                    setGraphEnabled(false);
                    setGraphData(null);
                    void loadGraph();
                  }}
                >
                  Retry
                </button>
              </div>
            </Card>
          )}
          {!graphEnabled && !graphError && (
            <Card className="mb-3 border-amber-200 bg-amber-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] tracking-[0.22em] text-amber-700 uppercase mb-1">
                    GRAPH LOADING PAUSED
                  </p>
                  <p className="text-xs text-amber-800">
                    Enable the graph to explore nodes. This reduces React dev-mode re-render churn.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  onClick={() => setGraphEnabled(true)}
                >
                  Load graph
                </button>
              </div>
            </Card>
          )}
            {graphEnabled && graphData && (
            <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              Added
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-700">
              Modified
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              Removed
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Unchanged
            </span>
            <span className="ml-2 text-[0.75rem] text-slate-500">
              {displayData.nodes.length} nodes · {displayData.edges.length} edges
            </span>
            <button
              type="button"
              className="ml-3 rounded-full border border-slate-200 px-3 py-1 text-[0.75rem] font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                // flip showOtherDomain via CSS custom event
                const evt = new CustomEvent("livingmap:toggle-other");
                window.dispatchEvent(evt);
              }}
            >
              Toggle “Other”
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-[0.75rem] font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowUnchanged((v) => !v)}
            >
              {showUnchanged ? "Hide unchanged" : "Show unchanged"}
            </button>
          </div>
          <CytoMap
            data={livingMapData}
            height={760}
            selectedNodeId={selectedNodeId ?? undefined}
            onSelectNode={(id) => setSelectedNodeId(id)}
            searchTerm={search}
            showUnchanged={showUnchanged}
            visibleNodeIds={visibleNodeIds}
            visibleEdgeIds={visibleEdgeIds}
          />
            </>
          )}
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Timeline</span>
              <input
                type="range"
                min={0}
                max={timelineStages.length - 1}
                value={timelineStage}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setTimelineStage(next);
                  const snap =
                    stageSnapshotForIndex[next] && stageSnapshotForIndex[next].nodes.length
                      ? stageSnapshotForIndex[next]
                      : livingMapData;
                  telemetry.log(
                    "timeline_stage_changed",
                    { stage: timelineStages[next], nodes_visible: snap.nodes.length, edges_visible: snap.edges.length },
                    simplificationScoreRef.current,
                  );
                  window.dispatchEvent(
                    new CustomEvent("timeline_stage_changed", {
                      detail: { stage: timelineStages[next], nodes: snap.nodes.length, edges: snap.edges.length },
                    }),
                  );
                }}
              />
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800">
                {timelineStages[timelineStage]}
              </span>
              <span className="text-slate-400">({stageSnapshots.current.nodes.length} → {stageSnapshots.future.nodes.length} nodes)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">ROI demo timeline</span>
              <input
                type="range"
                min={0}
                max={24}
                value={roiSim.month}
                onChange={(e) => roiSim.setMonth(Number(e.target.value))}
              />
              <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800">
                {roiSim.month}
              </span>
            </div>
            <NodeInsightPanel node={selectedNode} />
          </div>
          </section>

          {/* ROI + Events */}
          <section className="mt-12 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <ROIChart
              data={roiSim.timeline}
              breakEvenMonth={roiSim.breakEvenMonth}
              currentMonth={roiSim.month}
            />
            <EventLogPanel events={roiSim.filteredEvents} />
          </section>

          {/* Scenario Compare (beta) */}
          <section className="mt-12">
            <ScenarioComparePanel
              baseline={{
                systems: stats.systemsFuture ?? 0,
                integrations: stats.integrationsFuture ?? 0,
              }}
              roiSignal={roiSim.breakEvenMonth}
            />
          </section>

          {/* Top systems table */}
          <section className="mt-12">
            <h2 className="text-sm font-semibold mb-1">
              HIGHEST-CONNECTIVITY SYSTEMS
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Top 10 systems by number of integrations in this ecosystem view.
            </p>

            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      #
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      SYSTEM
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      INTEGRATIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topSystems.map((s, idx) => {
                    const name = resolveSystemName(s);
                    const count = resolveIntegrationCount(s);
                    const key = s.systemId ?? s.id ?? `${name}-${idx}`;

                    return (
                      <tr
                        key={key}
                        className={
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                        }
                      >
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSelectSystem(name, count)}
                            className="text-left w-full underline-offset-2 hover:underline"
                          >
                            {name}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {formatNumber(count)}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.topSystems.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-4 text-xs text-gray-500"
                        colSpan={3}
                      >
                        No systems with integrations detected yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Impact panel */}
          <section className="mt-10">
            <SystemImpactPanel
              impact={impact}
              loading={false}
              error={null}
              className="w-full"
            />
          </section>
        </>
      )}
    </div>
  );
}
