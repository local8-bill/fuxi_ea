"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { NodeInspector } from "@/components/graph/NodeInspector";
import type { GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { GraphControlPanel } from "@/components/graph/GraphLayoutSection";
import { getDomainAccent } from "@/components/graph/graphDomainColors";
import sequencerDataset from "@/data/sequencer.json";
import type { LivingMapData, LivingNode, LivingEdge } from "@/types/livingMap";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useUserGenome } from "@/lib/context/userGenome";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import type { LearningSnapshot } from "@/hooks/useLearningSnapshot";
import type { GraphFocus, GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";
import { useGraphTelemetry } from "@/hooks/useGraphTelemetry";
import { Stage } from "@/components/layout/Stage";
import { OptionMenu } from "@/components/layout/OptionMenu";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { useALEContext, aleContextStore } from "@/lib/ale/contextStore";
import { useExperienceFlow, type ExperienceScene } from "@/hooks/useExperienceFlow";
import {
  ACTIONS,
  DIGITAL_TWIN_TIMELINE,
  DIGITAL_TWIN_VERSION,
  DOMAIN_ALE_TAGS,
  FOCUS_LENSES,
  GOAL_HEURISTICS,
  GOAL_OPTIONS,
  PLATFORM_OPTIONS,
  STAGE_OPTIONS,
  VIEW_MODE_OPTIONS,
  type DigitalEnterpriseStats,
  type FlowStep,
  type FocusType,
  type GraphDataSource,
} from "@/features/digitalEnterprise/constants";
import { buildInsight, buildLivingMapData, formatNumber } from "@/features/digitalEnterprise/helpers";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { SequencePromptOverlay } from "@/features/digitalEnterprise/SequencePromptOverlay";

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

interface Props {
  projectId: string;
  onStatsUpdate?: (stats: DigitalEnterpriseStats | null) => void;
  learningSnapshot?: LearningSnapshot | null;
}

type SequencerItem = GraphSequencerItem;
const sequencerData = sequencerDataset as SequencerItem[];

type NodeMoveDirection = "toFuture" | "toCurrent";
type IntegrationSummary = { upstream: number; downstream: number; peers: string[] };
type DomainDiffItem = {
  node: LivingNode;
  state: "added" | "removed" | "changed" | "unchanged";
  pending?: NodeMoveDirection | null;
  integrationSummary?: IntegrationSummary;
};
type DomainDiffEntry = {
  domain: string;
  totalChanges: number;
  current: Array<DomainDiffItem>;
  future: Array<DomainDiffItem>;
};

const debugTwinLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "production") return;
  console.log("[DigitalTwin]", ...args);
};

export function DigitalEnterpriseClient({ projectId, onStatsUpdate, learningSnapshot: _learningSnapshot }: Props) {
  const { log: logTelemetry } = useTelemetry("digital_twin", { projectId });
  const searchParams = useSearchParams();
  const router = useRouter();
  const isEmbed = searchParams.get("embed") === "1";
  const { role, motivation, interactionStyle, preferredTone } = useUserGenome();
  const { context: aleContext } = useALEContext();
  const { setScene: setExperienceScene } = useExperienceFlow(projectId);
  void _learningSnapshot;

  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [futureGraphData, setFutureGraphData] = useState<LivingMapData | null>(null);
  const [graphDiffs, setGraphDiffs] = useState<{ added: Set<string>; removed: Set<string>; changed: Set<string> }>({
    added: new Set(),
    removed: new Set(),
    changed: new Set(),
  });
  const [manualMoves, setManualMoves] = useState<{ toFuture: Set<string>; toCurrent: Set<string> }>({
    toFuture: new Set(),
    toCurrent: new Set(),
  });
  const domainNavigatorRef = useRef<(domain: string) => void>();
  const [confirmedDomains, setConfirmedDomains] = useState<Set<string>>(new Set());
  const [graphLoading, setGraphLoading] = useState<boolean>(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [graphViewMode, setGraphViewMode] = useState<GraphViewMode>("systems");
  const [revealStage, setRevealStage] = useState<GraphRevealStage>("orientation");
  const [graphSource, setGraphSource] = useState<GraphDataSource>(null);
  const [graphSnapshotLabel, setGraphSnapshotLabel] = useState<string | null>(null);
  const [sequencePromptOpen, setSequencePromptOpen] = useState(false);
  const [sequencePromptValue, setSequencePromptValue] = useState("Replace OMS globally by 2029.");
  const [sequenceSubmitting, setSequenceSubmitting] = useState(false);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [graphVersion, setGraphVersion] = useState<"current" | "future">("current");
  const [activePhase] = useState(DIGITAL_TWIN_TIMELINE[0]?.id ?? "fy26");
  const sequence = useMemo(() => sequencerData, []);
  const [flowStep, setFlowStep] = useState<FlowStep>("domain");
  const flowStepRef = useRef<FlowStep>("domain");
  const [focusType, setFocusType] = useState<FocusType>("domain");
  const [selectedFocusValue, setSelectedFocusValue] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<{ edgeId: string; peerLabel: string } | null>(null);
  const [insightMessage, setInsightMessage] = useState<string | null>(null);
  const focusPromptLogged = useRef(false);
  const actionsLogged = useRef(false);

  const aiInsights = useAIInsights(graphData?.nodes ?? []);

  useEffect(() => {
    if (aleContext) return;
    let cancelled = false;
    const loadAleContext = async () => {
      try {
        const res = await fetch("/api/ale/context", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          aleContextStore.initialize(data);
        }
      } catch {
        // ignore fetch errors for now
      }
    };
    void loadAleContext();
    return () => {
      cancelled = true;
    };
  }, [aleContext]);
  const sendReasoningEvent = useCallback(
    (nodeId: string, action: string, tags: string[]) => {
      void fetch("/api/ale/reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: nodeId,
          user_action: action,
          context_tags: tags,
          user_mode: role,
        }),
      }).catch(() => null);
    },
    [role],
  );
  const graphTelemetry = useGraphTelemetry(projectId);
  const futureViewSet = useRef(false);
  const { ref: stageContainerRef, size: stageSize } = useResizeObserver<HTMLDivElement>();
  const responsiveDomainColumns = useMemo(() => {
    const width = stageSize.width;
    if (!width) return 3;
    if (width > 1800) return 5;
    if (width > 1400) return 4;
    if (width < 700) return 1;
    if (width < 1000) return 2;
    return 3;
  }, [stageSize.width]);
  const futureGraphReady = useMemo(() => {
    if (!futureGraphData) return false;
    return (futureGraphData.nodes?.length ?? 0) > 0;
  }, [futureGraphData]);
  const activeGraph = useMemo(() => {
    if (graphVersion === "future" && futureGraphData) return futureGraphData;
    return graphData;
  }, [futureGraphData, graphData, graphVersion]);

  const livingMapData = useMemo<LivingMapData>(() => {
    const fallback = activeGraph ?? { nodes: [], edges: [] };
    const safeNodes = ((fallback.nodes ?? []) as LivingNode[]).filter(Boolean);
    const enriched = safeNodes.map((node) => {
      const insight = aiInsights.insights[node.id];
      return {
        ...node,
        domain: insight?.domain ?? node.domain,
        aiReadiness: insight?.aiReadiness ?? node.aiReadiness,
        roiScore: insight?.opportunityScore ?? node.roiScore,
        disposition: insight?.disposition ?? node.disposition,
      };
    });
    return { nodes: enriched, edges: fallback.edges ?? [] };
  }, [activeGraph, aiInsights.insights]);
  const nodeLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    livingMapData.nodes.forEach((node) => {
      map.set(node.id, node.label ?? node.id);
    });
    return map;
  }, [livingMapData.nodes]);
  const integrationMap = useMemo(() => {
    const map = new Map<string, IntegrationSummary>();
    livingMapData.nodes.forEach((node) => {
      map.set(node.id, { upstream: 0, downstream: 0, peers: [] });
    });
    livingMapData.edges.forEach((edge) => {
      const sourceSummary = map.get(edge.source);
      const targetSummary = map.get(edge.target);
      if (sourceSummary) {
        sourceSummary.downstream += 1;
        const peerLabel = nodeLabelMap.get(edge.target) ?? edge.target;
        if (!sourceSummary.peers.includes(peerLabel) && sourceSummary.peers.length < 3) {
          sourceSummary.peers.push(peerLabel);
        }
      }
      if (targetSummary) {
        targetSummary.upstream += 1;
        const peerLabel = nodeLabelMap.get(edge.source) ?? edge.source;
        if (!targetSummary.peers.includes(peerLabel) && targetSummary.peers.length < 3) {
          targetSummary.peers.push(peerLabel);
        }
      }
    });
    return map;
  }, [livingMapData.edges, livingMapData.nodes, nodeLabelMap]);

  const effectiveDiffs = useMemo(() => {
    const added = new Set(graphDiffs.added);
    const removed = new Set(graphDiffs.removed);
    const changed = new Set(graphDiffs.changed);
    manualMoves.toFuture.forEach((id) => {
      added.add(id);
      removed.delete(id);
    });
    manualMoves.toCurrent.forEach((id) => {
      removed.add(id);
      added.delete(id);
    });
    return { added, removed, changed };
  }, [graphDiffs, manualMoves]);

  useEffect(() => {
    setManualMoves({ toFuture: new Set(), toCurrent: new Set() });
  }, [projectId, graphData, futureGraphData]);

  const domainDiffEntries = useMemo(() => {
    if (!graphData || !futureGraphData) return [];
    const domainMap = new Map<
      string,
      {
        current: Array<DomainDiffItem>;
        future: Array<DomainDiffItem>;
      }
    >();
    const currentNodes = (graphData.nodes ?? []) as LivingNode[];
    const futureNodes = (futureGraphData.nodes ?? []) as LivingNode[];
    const normalizeDomain = (domain: unknown) => (typeof domain === "string" && domain.trim().length ? domain : "Other");
    const manualFuture = manualMoves.toFuture;
    const manualCurrent = manualMoves.toCurrent;

    currentNodes.forEach((node) => {
      const domain = normalizeDomain(node.domain);
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { current: [], future: [] });
      }
      const integrationSummary = integrationMap.get(node.id);
      if (manualFuture.has(node.id)) {
        domainMap.get(domain)!.future.push({
          node,
          state: "added",
          pending: "toFuture",
          integrationSummary,
        });
        return;
      }
      domainMap.get(domain)!.current.push({
        node,
        state: effectiveDiffs.removed.has(node.id) ? "removed" : effectiveDiffs.changed.has(node.id) ? "changed" : "unchanged",
        integrationSummary,
      });
    });

    futureNodes.forEach((node) => {
      const domain = normalizeDomain(node.domain);
      if (!domainMap.has(domain)) {
        domainMap.set(domain, { current: [], future: [] });
      }
      const integrationSummary = integrationMap.get(node.id);
      if (manualCurrent.has(node.id)) {
        domainMap.get(domain)!.current.push({
          node,
          state: "removed",
          pending: "toCurrent",
          integrationSummary,
        });
        return;
      }
      domainMap.get(domain)!.future.push({
        node,
        state: effectiveDiffs.added.has(node.id) ? "added" : effectiveDiffs.changed.has(node.id) ? "changed" : "unchanged",
        integrationSummary,
      });
    });

    const entries = Array.from(domainMap.entries())
      .map(([domain, data]) => {
        const totalChanges =
          data.current.filter((item) => item.state !== "unchanged").length +
          data.future.filter((item) => item.state !== "unchanged").length;
        return { domain, totalChanges, ...data };
      })
      .filter((entry) => entry.totalChanges > 0)
      .sort((a, b) => {
        if (b.totalChanges === a.totalChanges) return a.domain.localeCompare(b.domain);
        return b.totalChanges - a.totalChanges;
      });

    return entries;
  }, [graphData, futureGraphData, effectiveDiffs, manualMoves, integrationMap]);

  useEffect(() => {
    setConfirmedDomains((prev) => {
      const next = new Set<string>();
      domainDiffEntries.forEach((entry) => {
        if (prev.has(entry.domain)) {
          next.add(entry.domain);
        }
      });
      if (next.size !== prev.size) return next;
      for (const domain of prev) {
        if (!next.has(domain)) return next;
      }
      return prev;
    });
  }, [domainDiffEntries]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    livingMapData.nodes.forEach((node) => {
      const key = ((node.domain as string) || "Other").trim() || "Other";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [livingMapData.nodes]);

  const domainSuggestions = useMemo(() => {
    const sorted = Object.entries(domainCounts)
      .filter(([domain]) => domain.toLowerCase() !== "unknown")
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([domain]) => domain);
    return (sorted.length ? sorted.slice(0, 4) : ["Commerce", "Finance", "Supply Chain", "Order Management"]).map(
      (domain) => domain.charAt(0).toUpperCase() + domain.slice(1),
    );
  }, [domainCounts]);

  const selectedSystem = useMemo(() => livingMapData.nodes.find((node) => node.id === selectedSystemId) ?? null, [livingMapData.nodes, selectedSystemId]);
  const remainingDomains = useMemo(
    () => domainDiffEntries.filter((entry) => !confirmedDomains.has(entry.domain)),
    [domainDiffEntries, confirmedDomains],
  );
  const topChangeDomains = useMemo(() => remainingDomains.slice(0, 4), [remainingDomains]);
  const nextReviewDomain = remainingDomains[0]?.domain ?? null;
  const allDomainsReviewed = futureGraphReady && domainDiffEntries.length > 0 && remainingDomains.length === 0;

  const systemCandidates = useMemo(() => {
    if (!selectedFocusValue) return [];
    if (focusType === "goal") {
      const heuristicKey = selectedFocusValue.toLowerCase();
      const scorer = GOAL_HEURISTICS[heuristicKey] ?? ((node: LivingNode) => node.roiScore ?? 0);
      return [...livingMapData.nodes]
        .map((node) => ({ node, score: scorer(node) }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 4)
        .map((entry) => entry.node);
    }
    const normalized = selectedFocusValue.toLowerCase();
    return livingMapData.nodes
      .filter((node) => (node.domain as string)?.toLowerCase() === normalized)
      .sort((a, b) => (b.integrationCount ?? 0) - (a.integrationCount ?? 0))
      .slice(0, 4);
  }, [livingMapData.nodes, selectedFocusValue, focusType]);

  const integrationCandidates = useMemo(() => {
    if (!selectedSystem) return [];
    return livingMapData.edges
      .filter((edge) => edge.source === selectedSystem.id || edge.target === selectedSystem.id)
      .slice(0, 4)
      .map((edge) => {
        const peerId = edge.source === selectedSystem.id ? edge.target : edge.source;
        const peer = livingMapData.nodes.find((node) => node.id === peerId);
        return {
          id: edge.id,
          label: peer?.label ?? "Unknown integration",
        };
      });
  }, [livingMapData.edges, livingMapData.nodes, selectedSystem]);

  const highlightNodeIds = useMemo(() => {
    if (selectedSystem) {
      const ids = new Set<string>([selectedSystem.id]);
      livingMapData.edges.forEach((edge) => {
        if (edge.source === selectedSystem.id) ids.add(edge.target);
        if (edge.target === selectedSystem.id) ids.add(edge.source);
      });
      return ids;
    }
    if (!selectedFocusValue) return null;
    if (focusType === "goal") {
      const heuristicKey = selectedFocusValue.toLowerCase();
      const scorer = GOAL_HEURISTICS[heuristicKey] ?? ((node: LivingNode) => node.roiScore ?? 0);
      const ids = [...livingMapData.nodes]
        .sort((a, b) => (scorer(b) ?? 0) - (scorer(a) ?? 0))
        .slice(0, 8)
        .map((node) => node.id);
      return ids.length ? new Set(ids) : null;
    }
    const normalized = selectedFocusValue.toLowerCase();
    const ids = livingMapData.nodes
      .filter((node) => (node.domain as string)?.toLowerCase() === normalized)
      .map((node) => node.id);
    return ids.length ? new Set(ids) : null;
  }, [livingMapData.nodes, livingMapData.edges, selectedSystem, selectedFocusValue, focusType]);

  const focusPulse = useMemo(() => {
    if (!highlightNodeIds || !highlightNodeIds.size) return null;
    const integrations = livingMapData.edges.filter((edge) => highlightNodeIds.has(edge.source) && highlightNodeIds.has(edge.target)).length;
    return {
      systems: highlightNodeIds.size,
      integrations,
      overlap: Math.max(4, Math.round(integrations * 1.1)),
    };
  }, [highlightNodeIds, livingMapData.edges]);

  const hasStats = Boolean(stats);
  const nodeCount = livingMapData.nodes.length;
  const edgeCount = livingMapData.edges.length;
  const hasGraph = (nodeCount ?? 0) > 0;
  const graphFocus: GraphFocus = useMemo(() => {
    if (flowStep === "integration") return "stage";
    return focusType === "goal" ? "goal" : "domain";
  }, [focusType, flowStep]);
  const inspectorTags = useMemo(() => {
    const domainKey = (selectedSystem?.domain ?? selectedFocusValue ?? "").toString().toLowerCase();
    if (focusType === "goal") return DOMAIN_ALE_TAGS.goal;
    return DOMAIN_ALE_TAGS[domainKey] ?? DOMAIN_ALE_TAGS.default;
  }, [selectedSystem, selectedFocusValue, focusType]);
  const inspectorName = selectedSystem?.label ?? (selectedFocusValue ? `${selectedFocusValue} lens` : null);
  const inspectorDomain = selectedSystem?.domain ?? selectedFocusValue ?? null;
  const inspectorModules = selectedSystem?.subcomponents ?? [];

  useEffect(() => {
    debugTwinLog("render:mount", { projectId });
    logTelemetry("digital_twin.render_start", { projectId, version: DIGITAL_TWIN_VERSION });
    logTelemetry("workspace_view", { projectId, version: DIGITAL_TWIN_VERSION });
  }, [projectId, logTelemetry]);

  const loadStats = useCallback(async () => {
    setStatsError(null);
    onStatsUpdate?.(null);
    debugTwinLog("stats:loading", { projectId });
    try {
      const res = await fetch(`/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Stats load failed ${res.status}: ${text}`);
      }
      const json = (await res.json()) as DigitalEnterpriseStats;
      setStats(json);
      onStatsUpdate?.(json);
      debugTwinLog("stats:loaded", { systems: json.systemsFuture, integrations: json.integrationsFuture });
    } catch (err) {
      debugTwinLog("stats:error", err);
      setStatsError(getErrorMessage(err, "Failed to load digital twin metrics."));
      setStats(null);
      onStatsUpdate?.(null);
    }
  }, [projectId, onStatsUpdate]);

  const loadGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(null);
    debugTwinLog("graph:loading", { projectId });
    try {
      const res = await fetch(`/api/digital-enterprise/view?project=${encodeURIComponent(projectId)}&mode=all`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Graph load failed ${res.status}: ${text}`);
      }
      const json = await res.json();
      const hasSplit = json?.current || json?.future;
      let builtCurrent: LivingMapData;
      let builtFuture: LivingMapData | null = null;
      let diffSets = { added: new Set<string>(), removed: new Set<string>(), changed: new Set<string>() };

      if (!hasSplit && Array.isArray(json?.nodes)) {
        const baseNodes = (json.nodes ?? []) as LivingNode[];
        const baseEdges = (json.edges ?? []) as LivingEdge[];
        const addedNodes = new Set(baseNodes.filter((node) => (node as any)?.state?.toLowerCase?.() === "added").map((node) => node.id));
        const removedNodes = new Set(baseNodes.filter((node) => (node as any)?.state?.toLowerCase?.() === "removed").map((node) => node.id));
        const changedNodes = new Set(baseNodes.filter((node) => (node as any)?.state?.toLowerCase?.() === "changed").map((node) => node.id));

        const currentNodes = baseNodes.filter((node) => !addedNodes.has(node.id));
        const futureNodes = baseNodes.filter((node) => !removedNodes.has(node.id));
        const currentIds = new Set(currentNodes.map((node) => node.id));
        const futureIds = new Set(futureNodes.map((node) => node.id));

        const currentEdges = baseEdges.filter((edge) => currentIds.has(edge.source) && currentIds.has(edge.target));
        const futureEdges = baseEdges.filter((edge) => futureIds.has(edge.source) && futureIds.has(edge.target));

        builtCurrent = buildLivingMapData({ nodes: currentNodes, edges: currentEdges });
        builtFuture = buildLivingMapData({ nodes: futureNodes, edges: futureEdges });
        diffSets = { added: addedNodes, removed: removedNodes, changed: changedNodes };
      } else {
        builtCurrent = buildLivingMapData(json?.current ?? json);
        builtFuture = json?.future ? buildLivingMapData(json.future) : null;
        const diff = json?.diff ?? {};
        diffSets = {
          added: new Set<string>(Array.isArray(diff.added) ? diff.added : []),
          removed: new Set<string>(Array.isArray(diff.removed) ? diff.removed : []),
          changed: new Set<string>(Array.isArray(diff.changed) ? diff.changed : []),
        };
      }

      setGraphData(builtCurrent);
      setFutureGraphData(builtFuture);
      setGraphDiffs(diffSets);
      setGraphSource("live");
      setGraphSnapshotLabel(null);
      debugTwinLog("graph:loaded", { nodes: builtCurrent.nodes.length, edges: builtCurrent.edges.length, hasFuture: Boolean(builtFuture) });
    } catch (err) {
      debugTwinLog("graph:error", err);
      setGraphError(getErrorMessage(err, "Failed to load graph data."));
      setGraphData(null);
      setFutureGraphData(null);
    } finally {
      debugTwinLog("graph:loading_complete", { projectId });
      setGraphLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStats();
    loadGraph();
  }, [loadStats, loadGraph]);

  const handleLoadLiveData = useCallback(() => {
    logTelemetry("digital_twin.load_live_data", { projectId });
    debugTwinLog("graph:live_reload_requested");
    void loadGraph();
  }, [loadGraph, logTelemetry, projectId]);

  const handleLoadSnapshotClick = useCallback(async () => {
    logTelemetry("digital_twin.load_snapshot_click", { projectId });
    setGraphLoading(true);
    setGraphError(null);
    try {
      const res = await fetch("/data/snapshots/enterprise_graph.json", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to fetch snapshot data.");
      }
      const json = await res.json();
      const built = buildLivingMapData(json);
      setGraphData(built);
      setGraphSource("snapshot");
      setGraphSnapshotLabel("enterprise_graph.json");
      logTelemetry("digital_twin.snapshot_loaded", { file: "enterprise_graph.json", nodes: built.nodes.length, edges: built.edges.length });
      debugTwinLog("graph:snapshot_loaded", { nodes: built.nodes.length, edges: built.edges.length });
    } catch (err) {
      debugTwinLog("graph:snapshot_error", err);
      setGraphError(getErrorMessage(err, "Unable to read snapshot file."));
    } finally {
      setGraphLoading(false);
    }
  }, [logTelemetry, projectId]);

  useEffect(() => {
    if (focusPromptLogged.current || graphLoading) return;
    focusPromptLogged.current = true;
    logTelemetry("digital_twin.focus_prompt_shown", { options: FOCUS_LENSES.map((lens) => lens.type) });
  }, [graphLoading, logTelemetry]);

  useEffect(() => {
    debugTwinLog("graph:state_change", {
      graphLoading,
      hasGraph,
      nodeCount,
      edgeCount,
      graphError,
      graphSource,
    });
  }, [graphLoading, hasGraph, nodeCount, edgeCount, graphError, graphSource]);

  useEffect(() => {
    if (!hasGraph || graphLoading) return;
    const timer = window.setTimeout(() => {
      setRevealStage((prev) => (prev === "orientation" ? "exploration" : prev));
      logTelemetry("digital_twin.graph_revealed", {
        nodes: livingMapData.nodes.length,
        edges: livingMapData.edges.length,
      });
      logTelemetry("digital_twin_loaded", {
        projectId,
        nodes: livingMapData.nodes.length,
        edges: livingMapData.edges.length,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [graphLoading, hasGraph, livingMapData.nodes.length, livingMapData.edges.length, logTelemetry, projectId]);

  useEffect(() => {
    emitAdaptiveEvent("ux_mode:set", { mode: "focus", step: flowStep });
  }, [flowStep]);

  useEffect(() => {
    if (!futureGraphReady && graphVersion === "future") {
      setGraphVersion("current");
    }
  }, [futureGraphReady, graphVersion]);

  useEffect(() => {
    if (!allDomainsReviewed) {
      futureViewSet.current = false;
      return;
    }
    if (futureGraphReady && !futureViewSet.current) {
      futureViewSet.current = true;
      setGraphVersion("future");
    }
  }, [allDomainsReviewed, futureGraphReady]);

  useEffect(() => {
    graphTelemetry.trackFocus(graphFocus, selectedFocusValue ? { value: selectedFocusValue } : undefined);
  }, [graphTelemetry, graphFocus, selectedFocusValue]);

  useEffect(() => {
    graphTelemetry.trackMode(graphViewMode);
  }, [graphTelemetry, graphViewMode]);

  useEffect(() => {
    graphTelemetry.trackStage(revealStage);
  }, [graphTelemetry, revealStage]);

  const advanceFlow = useCallback(
    (next: FlowStep) => {
      const prev = flowStepRef.current;
      if (prev === next) return;
      flowStepRef.current = next;
      setFlowStep(next);
      emitAdaptiveEvent("ux_mode:set", { mode: "focus", step: next });
      logTelemetry("digital_twin.transition_complete", { from: prev, to: next, role });
      logTelemetry("pulse_state_change", { projectId, from: prev, to: next });
    },
    [logTelemetry, projectId, role],
  );

  useEffect(() => {
    setSelectedFocusValue(null);
    setSelectedSystemId(null);
    setSelectedIntegration(null);
    setInsightMessage(null);
    flowStepRef.current = "domain";
    setFlowStep("domain");
  }, [focusType]);

  const handleFocusValueSelect = (value: string) => {
    setSelectedFocusValue(value);
    setSelectedSystemId(null);
    setSelectedIntegration(null);
    setInsightMessage(null);
    logTelemetry("digital_twin.focus_selected", { mode: focusType, value, role });
    const key = value.toLowerCase();
    const focusTags = focusType === "goal" ? DOMAIN_ALE_TAGS.goal : DOMAIN_ALE_TAGS[key] ?? DOMAIN_ALE_TAGS.default;
    sendReasoningEvent(key || "focus", "focus_selected", focusTags);
    advanceFlow("system");
  };

  const handleSystemSelect = useCallback(
    (systemId: string) => {
      const system = livingMapData.nodes.find((node) => node.id === systemId);
      if (!system) return;
      setSelectedSystemId(systemId);
      setSelectedIntegration(null);
      setInsightMessage(null);
      const domainKey = (system.domain as string | undefined)?.toLowerCase() ?? "";
      const tagSet = DOMAIN_ALE_TAGS[domainKey] ?? DOMAIN_ALE_TAGS.default;
      sendReasoningEvent(systemId, "system_selected", tagSet);
      advanceFlow("integration");
    },
    [advanceFlow, livingMapData.nodes, sendReasoningEvent],
  );
  const handleIntegrationSelect = (integrationId: string, peerLabel: string) => {
    if (!selectedSystem) return;
    setSelectedIntegration({ edgeId: integrationId, peerLabel });
    const message = buildInsight(role, motivation, selectedSystem.label, peerLabel, preferredTone);
    setInsightMessage(message);
    logTelemetry("digital_twin.insight_generated", {
      system: selectedSystem.label,
      peer: peerLabel,
      role,
      mode: focusType,
    });
    const domainKey = (selectedSystem.domain as string | undefined)?.toLowerCase() ?? "";
    const tagSet = DOMAIN_ALE_TAGS[domainKey] ?? DOMAIN_ALE_TAGS.default;
    sendReasoningEvent(integrationId, "integration_selected", tagSet);
    advanceFlow("insight");
  };

  const navigateToScene = useCallback(
    (targetScene: ExperienceScene, extras?: Record<string, string>) => {
      setExperienceScene(targetScene);
      const params = new URLSearchParams();
      params.set("scene", targetScene);
      if (extras) {
        Object.entries(extras).forEach(([key, value]) => {
          if (value != null) {
            params.set(key, value);
          }
        });
      }
      router.push(`/project/${projectId}/experience?${params.toString()}`, { scroll: false });
    },
    [projectId, router, setExperienceScene],
  );

  const handleGraphNodeSelect = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) {
        setSelectedSystemId(null);
        setSelectedIntegration(null);
        setInsightMessage(null);
        return;
      }
      handleSystemSelect(nodeId);
    },
    [handleSystemSelect],
  );

  const handleOptionMenuAction = useCallback(
    (actionId: string) => {
      if (actionId === "sequence") {
        setSequencePromptOpen(true);
        setSequenceError(null);
        logTelemetry("digital_twin.sequence_prompt_opened", { projectId });
        return;
      }
      if (actionId === "harmonize") {
        logTelemetry("digital_twin.option_harmonize", { projectId });
        navigateToScene("review");
        return;
      }
      if (actionId === "view") {
        logTelemetry("digital_twin.option_add_view", { projectId });
        navigateToScene("digital", { lens: "custom" });
      }
    },
    [logTelemetry, navigateToScene, projectId],
  );

  const closeSequencePrompt = useCallback(() => {
    setSequencePromptOpen(false);
    setSequenceError(null);
  }, []);

  const handleSequenceSubmit = useCallback(async () => {
    const intent = sequencePromptValue.trim();
    if (!intent) {
      setSequenceError("Describe what you want to modernize.");
      return;
    }
    setSequenceSubmitting(true);
    setSequenceError(null);
    try {
      await fetch("/api/intent/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: intent, projectId }),
      }).catch(() => null);
      if (typeof window !== "undefined") {
        const payload = {
          projectId,
          prompt: intent,
          graph: livingMapData,
          aleContext,
          source: graphSource ?? "live",
          snapshotLabel: graphSnapshotLabel,
          timestamp: Date.now(),
        };
        try {
          window.sessionStorage.setItem("fuxi_sequence_intent", JSON.stringify(payload));
        } catch {
          // ignore storage quota constraints
        }
        logTelemetry("digital_twin.sequence_intent_generated", { projectId, nodes: livingMapData.nodes.length, edges: livingMapData.edges.length });
        navigateToScene("sequencer");
      }
    } catch (err) {
      setSequenceError(getErrorMessage(err, "Unable to build a sequence right now."));
    } finally {
      setSequenceSubmitting(false);
    }
  }, [aleContext, graphSnapshotLabel, graphSource, livingMapData, logTelemetry, navigateToScene, projectId, sequencePromptValue]);

  const handleGraphViewModeChange = (mode: GraphViewMode) => {
    setGraphViewMode(mode);
    logTelemetry("digital_twin.view_mode_changed", { mode });
  };

  const handleRevealStageChange = (stage: GraphRevealStage) => {
    setRevealStage(stage);
  };

  const focusSummary = useMemo(() => {
    if (!selectedFocusValue) return "Pick a focus lens so I can compress the map for you.";
    const label =
      focusType === "goal"
        ? `${selectedFocusValue} objective`
        : `${selectedFocusValue} ${focusType === "platform" ? "platform" : "domain"}`;
    if (!selectedSystem) return `Scanning the ${label}. Pick a system to zoom in.`;
    if (!selectedIntegration) return `Tracing ${selectedSystem.label}. Choose an adjacent integration to inspect.`;
    return `Highlighting ${selectedSystem.label} <-> ${selectedIntegration.peerLabel}. Ready for the next move?`;
  }, [selectedFocusValue, focusType, selectedSystem, selectedIntegration]);

  const lensPrompt =
    focusType === "goal" ? "Which objective should we chase first?" : focusType === "platform" ? "Which platform should we anchor on?" : "Which domain should we study first?";

  const promptsByRole: Record<FlowStep, string> = {
    domain: interactionStyle === "narrative" ? `Let's ease in, ${role}. ${lensPrompt}` : lensPrompt,
    system:
      interactionStyle === "narrative"
        ? "I spotlighted the busiest systems in that focus. Want to zoom into one?"
        : "Pick the system that feels most congested right now.",
    integration:
      interactionStyle === "narrative"
        ? "These connections carry most of the load. Which one should we interrogate?"
        : "Select the integration that needs clarity.",
    insight:
      interactionStyle === "narrative"
        ? "Here's the insight I generated. Want me to route it somewhere?"
        : "Insight ready. Where should I send you next?",
  };

  useEffect(() => {
    if (flowStep === "insight" && insightMessage && !actionsLogged.current) {
      logTelemetry("digital_twin.actions_shown", { options: ACTIONS.map((action) => action.key), role });
      actionsLogged.current = true;
    }
    if (flowStep !== "insight") actionsLogged.current = false;
  }, [flowStep, insightMessage, role, logTelemetry]);

  const renderFlowButtons = () => {
    switch (flowStep) {
      case "domain":
        {
          const options =
            focusType === "platform"
              ? PLATFORM_OPTIONS
              : focusType === "goal"
                ? GOAL_OPTIONS
                : domainSuggestions;
          return (
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleFocusValueSelect(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    selectedFocusValue === option ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          );
        }
      case "system":
        return (
          <div className="flex flex-wrap gap-2">
            {systemCandidates.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSystemSelect(node.id)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                  selectedSystemId === node.id ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50 hover:border-slate-900"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{node.label}</p>
                <p className="text-[0.7rem] text-slate-500">Connections: {node.integrationCount ?? 0}</p>
              </button>
            ))}
          </div>
        );
      case "integration":
        return (
          <div className="flex flex-wrap gap-2">
            {integrationCandidates.map((edge) => (
              <button
                key={edge.id}
                type="button"
                onClick={() => handleIntegrationSelect(edge.id, edge.label)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-slate-900"
              >
                <p className="text-sm font-semibold text-slate-900">{edge.label}</p>
                <p className="text-[0.7rem] text-slate-500">Integration focus</p>
              </button>
            ))}
          </div>
        );
      case "insight":
      default:
        return insightMessage ? <p className="text-sm text-slate-800">{insightMessage}</p> : null;
    }
  };

  const leftRailPanels = (
    <div className="space-y-4">
      {domainDiffEntries.length ? (
        <GraphControlPanel title="Change Review">
          <p className="text-xs text-slate-500">{nextReviewDomain ? `Next: ${nextReviewDomain}` : "All domains reviewed."}</p>
          <div className="mt-2 space-y-2">
            {topChangeDomains.map((entry) => (
              <button
                key={`focus-domain-${entry.domain}`}
                type="button"
                onClick={() => navigateToDomain(entry.domain)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-slate-900"
              >
                {entry.domain}
                <span className="ml-2 text-[0.6rem] font-normal uppercase tracking-[0.3em] text-slate-400">Δ {entry.totalChanges}</span>
              </button>
            ))}
          </div>
        </GraphControlPanel>
      ) : null}
      {false && (
        <>
          <GraphControlPanel title="Guided Focus">
            <p className="text-xs text-slate-500">{promptsByRole[flowStep]}</p>
            <p className="mt-1 text-sm text-slate-800">{focusSummary}</p>
            <div className="mt-3 space-y-3">{renderFlowButtons()}</div>
          </GraphControlPanel>
          <GraphControlPanel title="View Mode">
            <div className="flex flex-wrap gap-2">
              {VIEW_MODE_OPTIONS.map((option) => {
                const isActive = graphViewMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleGraphViewModeChange(option.id)}
                    className={clsx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-900",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </GraphControlPanel>
          <GraphControlPanel title="Reveal States">
            <div className="space-y-2">
              {STAGE_OPTIONS.map((stageOption) => {
                const isActive = revealStage === stageOption.id;
                return (
                  <button
                    key={stageOption.id}
                    type="button"
                    onClick={() => handleRevealStageChange(stageOption.id)}
                    className={clsx(
                      "w-full rounded-2xl border px-3 py-2 text-left transition",
                      isActive ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                    )}
                  >
                    <p className="text-sm font-semibold">{stageOption.label}</p>
                    <p className="text-[0.7rem] uppercase tracking-[0.25em] text-neutral-500">{stageOption.helper}</p>
                  </button>
                );
              })}
            </div>
          </GraphControlPanel>
        </>
      )}
    </div>
  );

  const sequencePromptProps = {
    open: sequencePromptOpen,
    value: sequencePromptValue,
    error: sequenceError,
    submitting: sequenceSubmitting,
    aleConnected: Boolean(aleContext),
    graphSource,
    graphSnapshotLabel,
    onChange: setSequencePromptValue,
    onClose: closeSequencePrompt,
    onSubmit: handleSequenceSubmit,
  };
  const handleDiffMove = useCallback((nodeId: string, direction: NodeMoveDirection) => {
    setManualMoves((prev) => {
      const nextToFuture = new Set(prev.toFuture);
      const nextToCurrent = new Set(prev.toCurrent);
      if (direction === "toFuture") {
        if (nextToFuture.has(nodeId)) {
          nextToFuture.delete(nodeId);
        } else {
          nextToFuture.add(nodeId);
          nextToCurrent.delete(nodeId);
        }
      } else {
        if (nextToCurrent.has(nodeId)) {
          nextToCurrent.delete(nodeId);
        } else {
          nextToCurrent.add(nodeId);
          nextToFuture.delete(nodeId);
        }
      }
      return { toFuture: nextToFuture, toCurrent: nextToCurrent };
    });
  }, []);
  const handleConfirmDomain = useCallback((domain: string) => {
    setConfirmedDomains((prev) => {
      const next = new Set(prev);
      next.add(domain);
      return next;
    });
  }, []);
  const handleDomainNavigatorReady = useCallback((fn: (domain: string) => void) => {
    domainNavigatorRef.current = fn;
  }, []);
  const navigateToDomain = useCallback((domain: string | null) => {
    if (!domain) return;
    domainNavigatorRef.current?.(domain);
  }, []);
  const handleSaveReview = useCallback(() => {
    const payload = {
      projectId,
      savedAt: new Date().toISOString(),
      confirmedDomains: Array.from(confirmedDomains),
      manualMoves: {
        toFuture: Array.from(manualMoves.toFuture),
        toCurrent: Array.from(manualMoves.toCurrent),
      },
    };
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`fuxi_domain_review_${projectId}`, JSON.stringify(payload));
      }
      debugTwinLog("review:saved", payload);
    } catch (err) {
      console.warn("[DigitalTwin] Unable to persist review payload", err);
    }
  }, [confirmedDomains, manualMoves.toCurrent, manualMoves.toFuture, projectId]);

  const denoiseView = (
    <Fragment>
      <div className={isEmbed ? "px-4 py-6" : "px-6 pt-4 pb-8"}>
        {statsError ? (
          <div className="mb-4">
            <ErrorBanner message={statsError} onRetry={loadStats} />
          </div>
        ) : null}
        {graphError ? (
          <Card className="mb-4 border-rose-200 bg-rose-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-rose-700">{graphError}</p>
              <button type="button" className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white" onClick={loadGraph}>
                Retry
              </button>
            </div>
          </Card>
        ) : null}
        <SceneTemplate
          leftRail={
            <div className="space-y-6">
              <DigitalDataRail
                onLoadLiveData={handleLoadLiveData}
                onLoadSnapshot={handleLoadSnapshotClick}
                graphSource={graphSource}
                graphSnapshotLabel={graphSnapshotLabel}
                aleConnected={Boolean(aleContext)}
              />
              {leftRailPanels}
            </div>
          }
          rightRail={
            <DigitalRightRail
              aleConnected={Boolean(aleContext)}
              inspectorName={inspectorName}
              inspectorDomain={inspectorDomain}
              inspectorTags={inspectorTags}
              inspectorModules={inspectorModules}
              onOptionAction={handleOptionMenuAction}
            />
          }
        >
          <div
            ref={stageContainerRef}
            className="flex flex-1 overflow-hidden"
            style={{ height: "calc(100vh - 60px)", minHeight: "calc(100vh - 60px)" }}
          >
            <Stage padded={false} className="min-h-[calc(100vh-140px)]">
              <div className="border-b border-slate-200 px-6 py-4 text-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Systems - Integrations</p>
                    <h2 className="text-2xl font-semibold">Enterprise Ecosystem</h2>
                    <p className="text-xs text-slate-500">
                      Viewing {graphVersion === "future" ? "Future (deltas highlighted)" : "Current"} · {graphData ? `${graphData.nodes.length} systems` : "—"}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                    <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">{graphViewMode.toUpperCase()}</div>
                    <div className="flex items-center overflow-hidden rounded-full border border-slate-200 text-xs font-semibold text-slate-700">
                      <button
                        type="button"
                        className={`px-3 py-1 ${graphVersion === "current" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                        onClick={() => setGraphVersion("current")}
                      >
                        Current
                      </button>
                      <button
                        type="button"
                        className={clsx(
                          "px-3 py-1",
                          graphVersion === "future" ? "bg-slate-900 text-white" : "bg-white text-slate-700",
                          !futureGraphReady && "cursor-not-allowed opacity-60",
                        )}
                        onClick={() => setGraphVersion("future")}
                        disabled={!futureGraphReady}
                        title={futureGraphReady ? "View highlighted changes" : "Future view unlocks once Transition data loads"}
                      >
                        Future
                      </button>
                    </div>
                    {nextReviewDomain ? (
                      <button
                        type="button"
                        onClick={() => navigateToDomain(nextReviewDomain)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-900"
                      >
                        Review {nextReviewDomain}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleSaveReview}
                      className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      Save Review
                    </button>
                  </div>
                </div>
                {!futureGraphReady ? (
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Load Transition data to enable Future view
                  </p>
                ) : (
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Future view highlights deltas</p>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-4 p-4 min-h-0">
                {futureGraphReady && domainDiffEntries.length && !allDomainsReviewed ? (
                  <DomainDiffPanel
                    entries={domainDiffEntries}
                    variant={graphVersion}
                    className="flex-1"
                    onMoveNode={handleDiffMove}
                    confirmedDomains={confirmedDomains}
                    onConfirmDomain={handleConfirmDomain}
                    onNavigatorReady={handleDomainNavigatorReady}
                  />
                ) : futureGraphReady && allDomainsReviewed ? (
                  <div className="flex h-full flex-col gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Future architecture ready</p>
                        <p className="text-xs text-slate-500">Explore the harmonized graph below, then build a sequence when you&apos;re confident.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGraphVersion("current")}
                          className={clsx(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            graphVersion === "current" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
                          )}
                        >
                          Current
                        </button>
                        <button
                          type="button"
                          onClick={() => setGraphVersion("future")}
                          className={clsx(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            graphVersion === "future" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700",
                          )}
                        >
                          Future
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOptionMenuAction("sequence")}
                          className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          Build a Sequence
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-h-[400px] overflow-hidden rounded-[32px] border border-slate-200 bg-white">
                      <GraphCanvas
                        nodes={livingMapData.nodes}
                        edges={livingMapData.edges}
                        focus={graphFocus}
                        focusSummary={focusSummary}
                        viewMode={graphViewMode}
                        stage={revealStage}
                        highlightNodeIds={highlightNodeIds}
                        selectedNodeId={selectedSystemId}
                        onNodeSelect={handleGraphNodeSelect}
                        onViewModeChange={handleGraphViewModeChange}
                        onStageChange={handleRevealStageChange}
                        projectId={projectId}
                        height="100%"
                        domainColumns={responsiveDomainColumns}
                        fitViewKey={`${graphVersion}-${responsiveDomainColumns}-${Math.round(stageSize.width ?? 0)}`}
                        sequence={sequence}
                        scenarioPhase={activePhase}
                        showCanvasControls={false}
                        showIntegrationOverlay={flowStep === "integration"}
                        diffMode={graphVersion}
                        diffAnnotations={
                          graphVersion === "future"
                            ? {
                                added: effectiveDiffs.added,
                                removed: effectiveDiffs.removed,
                                changed: effectiveDiffs.changed,
                              }
                            : undefined
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/80 p-6 text-center text-sm text-slate-500">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-slate-900">Awaiting Future graph</p>
                      <p>Import Transition/Harmonize outputs or run sequencing to compare Current vs Future systems.</p>
                      {!futureGraphReady ? (
                        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Future view activates automatically once data arrives.</p>
                      ) : (
                        <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">No deltas detected yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Stage>
          </div>
        </SceneTemplate>
      </div>
      <SequencePromptOverlay {...sequencePromptProps} />
    </Fragment>
  );

  return denoiseView;
}

export function DigitalTwinTelemetryCard({ stats }: { stats: DigitalEnterpriseStats | null }) {
  const hasStats = Boolean(stats);
  return (
    <Card className="space-y-3 border-slate-200">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Telemetry Pulse</p>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Readiness</p>
          <p className="text-2xl font-semibold text-slate-900">{hasStats ? Math.min(95, Math.round(58 + (stats?.systemsFuture ?? 40) / 4)) : 64}%</p>
          <p className="text-[0.7rem] text-slate-500">Graph fidelity + session stability</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Impact</p>
          <p className="text-2xl font-semibold text-slate-900">{hasStats ? Math.min(98, Math.round(60 + (stats?.integrationsFuture ?? 0) / 2.5)) : 72}%</p>
          <p className="text-[0.7rem] text-slate-500">Projected value of current focus</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="text-2xl font-semibold text-slate-900">
            {hasStats ? Math.min(94, Math.round(58 + ((stats?.integrationsFuture ?? 1) / Math.max(1, stats?.systemsFuture ?? 1)) * 14)) : 62}%
          </p>
          <p className="text-[0.7rem] text-slate-500">Sensor coverage + telemetry freshness</p>
        </div>
      </div>
    </Card>
  );
}

function DigitalDataRail({
  onLoadLiveData,
  onLoadSnapshot,
  graphSource,
  graphSnapshotLabel,
  aleConnected,
}: {
  onLoadLiveData: () => void;
  onLoadSnapshot: () => void;
  graphSource: GraphDataSource;
  graphSnapshotLabel: string | null;
  aleConnected: boolean;
}) {
  const sourceLabel = graphSource === "snapshot" ? graphSnapshotLabel ?? "Snapshot" : graphSource === "live" ? "Live (API)" : "Not loaded";
  return (
    <div className="space-y-4 text-sm text-slate-700">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Data</p>
        <div className="mt-3 space-y-2">
          <button type="button" onClick={onLoadLiveData} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left font-semibold hover:border-slate-900">
            Load Live Data
          </button>
          <button type="button" onClick={onLoadSnapshot} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left font-semibold hover:border-slate-900">
            Load Snapshot (.json)
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs">
        <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">Current Source</p>
        <p className="mt-1 text-sm text-slate-900">{sourceLabel}</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs">
        <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">ALE Context</p>
        <p className="mt-1 text-sm text-slate-900">{aleConnected ? "Connected" : "Initializing..."}</p>
      </div>
    </div>
  );
}

function DigitalRightRail({
  aleConnected,
  inspectorName,
  inspectorDomain,
  inspectorTags,
  inspectorModules,
  onOptionAction,
}: {
  aleConnected: boolean;
  inspectorName: string | null;
  inspectorDomain: string | null;
  inspectorTags: string[];
  inspectorModules: string[];
  onOptionAction: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <OptionMenu onAction={onOptionAction} />
      <Card className="space-y-2 border-slate-200">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">ALE Context</p>
        <p className="text-sm font-semibold text-slate-900">{aleConnected ? "Connected" : "Initializing..."}</p>
        <p className="text-xs text-slate-500">{aleConnected ? "Live reasoning available" : "Awaiting telemetry"}</p>
      </Card>
      <NodeInspector nodeName={inspectorName} domain={inspectorDomain} tags={inspectorTags} subcomponents={inspectorModules} />
    </div>
  );
}

function DomainDiffPanel({
  entries,
  variant,
  className,
  onMoveNode,
  confirmedDomains,
  onConfirmDomain,
  onNavigatorReady,
}: {
  entries: DomainDiffEntry[];
  variant: "current" | "future";
  className?: string;
  onMoveNode?: (nodeId: string, direction: NodeMoveDirection) => void;
  confirmedDomains: Set<string>;
  onConfirmDomain?: (domain: string) => void;
  onNavigatorReady?: (handler: (domain: string) => void) => void;
}) {
  if (!entries.length) return null;
  const showColors = variant === "future";
  const [activeDomain, setActiveDomain] = useState(entries[0]?.domain ?? "");
  const makeAnchorId = useCallback((domain: string) => `domain-${domain.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, []);
  const handleDomainSelect = useCallback(
    (domain: string) => {
      setActiveDomain(domain);
      const anchor = document.getElementById(makeAnchorId(domain));
      if (anchor) {
        anchor.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [makeAnchorId],
  );
  useEffect(() => {
    if (!entries.length) return;
    setActiveDomain((prev) => (entries.some((entry) => entry.domain === prev) ? prev : entries[0]?.domain ?? ""));
    onNavigatorReady?.(handleDomainSelect);
  }, [entries, handleDomainSelect, onNavigatorReady]);
  const visibleEntries = entries.filter((entry) => !confirmedDomains.has(entry.domain));
  return (
    <Card className={clsx("flex h-full flex-col space-y-3 border border-slate-200 bg-white/95", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Current vs Future overview</p>
          <p className="text-xs text-slate-500">Application · Integrations</p>
        </div>
        {showColors ? (
          <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-400">
            <span className="text-emerald-600">■ Added</span>
            <span className="text-amber-600">■ Changed</span>
            <span className="text-rose-600">■ Removed</span>
          </div>
        ) : null}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {visibleEntries.length === 0 && (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm text-emerald-800">
            All domains reviewed! Continue to Sequencer to apply the plan.
          </div>
        )}
        {visibleEntries.map((entry) => (
          <div key={entry.domain} id={makeAnchorId(entry.domain)} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-900">
              <span>{entry.domain}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{entry.totalChanges} changes</span>
                <button
                  type="button"
                  onClick={() => onConfirmDomain?.(entry.domain)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-700 hover:border-emerald-400"
                >
                  Mark Done
                </button>
              </div>
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <DiffColumn heading="Current" items={entry.current} activeVersion="current" showColors={showColors} onMove={onMoveNode} />
              <DiffColumn heading="Future" items={entry.future} activeVersion="future" showColors={showColors} onMove={onMoveNode} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DiffColumn({
  heading,
  items,
  activeVersion,
  showColors,
  onMove,
}: {
  heading: string;
  items: Array<DomainDiffItem>;
  activeVersion: "current" | "future";
  showColors: boolean;
  onMove?: (nodeId: string, direction: NodeMoveDirection) => void;
}) {
  const moveDirection: NodeMoveDirection = activeVersion === "current" ? "toFuture" : "toCurrent";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-400">{heading}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => {
            const accentColor = getDomainAccent(item.node.domain);
            const dotColor = showColors ? (activeVersion === "future" ? getFutureTone(item.state) : getCurrentTone(item.state)) : "bg-slate-300";
            const textTone = showColors ? getLabelTone(activeVersion, item.state) : "text-slate-900";
            const integrationTone = showColors ? getIntegrationTone(activeVersion, item.state) : "text-slate-500";
            return (
              <li key={`${heading}-${item.node.id}`} className="space-y-1 rounded-2xl border border-slate-100 bg-white/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                      textTone,
                    )}
                    style={{ borderColor: accentColor }}
                  >
                    <span className={clsx("h-2 w-2 rounded-full", dotColor)} aria-hidden />
                    <span className="text-[13px]">{item.node.label ?? item.node.id}</span>
                  </span>
                  <span className={`text-xs font-semibold whitespace-nowrap ${integrationTone}`}>Integrations · {item.node.integrationCount ?? 0}</span>
                </div>
                {item.integrationSummary ? (
                  <div className="text-[0.65rem] text-slate-500">
                    <p>
                      Upstream {item.integrationSummary.upstream} · Downstream {item.integrationSummary.downstream}
                    </p>
                    {item.integrationSummary.peers.length ? (
                      <p className="text-[0.6rem] text-slate-400">Peers: {item.integrationSummary.peers.join(", ")}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-slate-400">
                  {item.pending ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                      Pending · {item.pending === "toFuture" ? "Future" : "Current"}
                    </span>
                  ) : null}
                  {onMove ? (
                    <button
                      type="button"
                      onClick={() => onMove(item.node.id, moveDirection)}
                      className="rounded-full border border-slate-200 px-3 py-0.5 text-[0.6rem] font-semibold text-slate-700 hover:border-slate-900"
                    >
                      {moveDirection === "toFuture" ? "Send to Future" : "Return to Current"}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">No changes.</p>
      )}
    </div>
  );
}

function getCurrentTone(state: "added" | "removed" | "changed" | "unchanged") {
  if (state === "removed") return "bg-rose-400";
  if (state === "changed") return "bg-amber-400";
  return "bg-slate-400";
}

function getFutureTone(state: "added" | "removed" | "changed" | "unchanged") {
  if (state === "added") return "bg-emerald-500";
  if (state === "changed") return "bg-amber-500";
  if (state === "removed") return "bg-rose-500";
  return "bg-slate-300";
}

function getLabelTone(version: "current" | "future", state: "added" | "removed" | "changed" | "unchanged") {
  if (version === "current") {
    if (state === "removed") return "text-rose-700 line-through";
    if (state === "changed") return "text-amber-700";
    return "text-slate-900";
  }
  if (state === "added") return "text-emerald-700";
  if (state === "changed") return "text-amber-700";
  if (state === "removed") return "text-rose-700";
  return "text-slate-900";
}

function getIntegrationTone(version: "current" | "future", state: "added" | "removed" | "changed" | "unchanged") {
  if (version === "current") {
    if (state === "removed") return "text-rose-700";
    if (state === "changed") return "text-amber-700";
    return "text-slate-500";
  }
  if (state === "added") return "text-emerald-700";
  if (state === "changed") return "text-amber-700";
  if (state === "removed") return "text-rose-700";
  return "text-slate-500";
}
