"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import clsx from "clsx";
import { NodeInspector } from "@/components/graph/NodeInspector";
import { GraphSimulationControls, PhaseInsightStrip, type PhaseInsight } from "@/components/graph/GraphSimulationControls";
import { GraphSequencerPanel, type GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { GraphControlPanel } from "@/components/graph/GraphLayoutSection";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { Icons } from "@/components/ui/icons";
import sequencerDataset from "@/data/sequencer.json";
import type { LivingMapData, LivingNode } from "@/types/livingMap";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useUserGenome } from "@/lib/context/userGenome";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import type { LearningSnapshot } from "@/hooks/useLearningSnapshot";
import type { GraphFocus, GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";
import { useGraphTelemetry } from "@/hooks/useGraphTelemetry";
import { Rail } from "@/components/layout/Rail";
import { Stage } from "@/components/layout/Stage";
import { OptionMenu } from "@/components/layout/OptionMenu";
import { useALEContext, aleContextStore } from "@/lib/ale/contextStore";
import { useExperienceFlow, type ExperienceScene } from "@/hooks/useExperienceFlow";
import {
  ACTIONS,
  DIGITAL_TWIN_DENOISE_MODE,
  DIGITAL_TWIN_TIMELINE,
  DIGITAL_TWIN_VERSION,
  DOMAIN_ALE_TAGS,
  FOCUS_LENSES,
  GOAL_HEURISTICS,
  GOAL_OPTIONS,
  LEFT_RAIL_STORAGE_KEY,
  PLATFORM_OPTIONS,
  RIGHT_RAIL_STORAGE_KEY,
  STAGE_OPTIONS,
  VIEW_MODE_OPTIONS,
  type DigitalEnterpriseStats,
  type FlowStep,
  type FocusType,
  type GraphDataSource,
} from "@/features/digitalEnterprise/constants";
import { buildInsight, buildLivingMapData, formatNumber } from "@/features/digitalEnterprise/helpers";
import { SequencePromptOverlay } from "@/features/digitalEnterprise/SequencePromptOverlay";

const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

interface Props {
  projectId: string;
  onStatsUpdate?: (stats: DigitalEnterpriseStats | null) => void;
  learningSnapshot?: LearningSnapshot | null;
}

type SequencerItem = GraphSequencerItem;
const sequencerData = sequencerDataset as SequencerItem[];

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
  const [graphLoading, setGraphLoading] = useState<boolean>(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [graphRevealed, setGraphRevealed] = useState(false);
  const [graphViewMode, setGraphViewMode] = useState<GraphViewMode>("systems");
  const [revealStage, setRevealStage] = useState<GraphRevealStage>("orientation");
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [graphSource, setGraphSource] = useState<GraphDataSource>(null);
  const [graphSnapshotLabel, setGraphSnapshotLabel] = useState<string | null>(null);
  const [sequencePromptOpen, setSequencePromptOpen] = useState(false);
  const [sequencePromptValue, setSequencePromptValue] = useState("Replace OMS globally by 2029.");
  const [sequenceSubmitting, setSequenceSubmitting] = useState(false);
  const [sequenceError, setSequenceError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(DIGITAL_TWIN_TIMELINE[0]?.id ?? "fy26");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2600);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const [sequence, setSequence] = useState<SequencerItem[]>(sequencerData);
  const [dragId, setDragId] = useState<string | null>(null);
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
  const phaseInsights: PhaseInsight[] = useMemo(
    () =>
      DIGITAL_TWIN_TIMELINE.map((band) => {
        const items = sequence.filter((step) => step.phase === band.id);
        if (!items.length) {
          return { phase: band.id, label: band.label, roi: 0, tcc: 0, risk: 0.5 };
        }
        const totals = items.reduce(
          (acc, step) => {
            acc.roi += step.impact;
            acc.tcc += step.cost;
            acc.risk += 1 - step.impact;
            return acc;
          },
          { roi: 0, tcc: 0, risk: 0 },
        );
        return {
          phase: band.id,
          label: band.label,
          roi: totals.roi / items.length,
          tcc: totals.tcc,
          risk: totals.risk / items.length,
        };
      }),
    [sequence],
  );
  const logLearningEvent = useCallback((code: string, details?: Record<string, unknown>) => {
    void fetch("/api/ale/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, details, source: "digital_twin" }),
    }).catch(() => null);
  }, []);
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (id: string) => {
    if (!dragId || dragId === id) return;
    const currentIndex = sequence.findIndex((item) => item.id === dragId);
    const targetIndex = sequence.findIndex((item) => item.id === id);
    if (currentIndex === -1 || targetIndex === -1) return;
    const updated = [...sequence];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setSequence(updated);
    logLearningEvent("LE-002", { from: currentIndex, to: targetIndex, item: moved.id });
  };
  const handleDragEnd = () => setDragId(null);
  const handlePhaseChange = useCallback(
    (phase: string) => {
      setActivePhase(phase);
      logTelemetry("digital_twin.phase_changed", { phase });
      emitAdaptiveEvent("ux_mode:set", { mode: "digital-phase", step: phase });
      logLearningEvent("LE-001", { phase });
    },
    [logTelemetry, logLearningEvent],
  );
  const phaseOrder = useMemo(() => DIGITAL_TWIN_TIMELINE.map((band) => band.id), []);
  const stepPhaseForward = useCallback(() => {
    setActivePhase((current) => {
      const currentIndex = phaseOrder.indexOf(current);
      const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];
      logLearningEvent("LE-004", { nextPhase });
      return nextPhase;
    });
  }, [phaseOrder, logLearningEvent]);
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
      playbackTimer.current = null;
      return;
    }
    playbackTimer.current = setInterval(() => {
      stepPhaseForward();
    }, playbackSpeed);
    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, [isPlaying, playbackSpeed, stepPhaseForward]);
  const handlePlaybackToggle = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      logLearningEvent(next ? "LE-006" : "LE-007", { playing: next });
      return next;
    });
  };
  const livingMapData = useMemo<LivingMapData>(() => {
    const fallback = graphData ?? { nodes: [], edges: [] };
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
  }, [graphData, aiInsights.insights]);

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
  const focusLabel = selectedSystem?.label ?? (selectedFocusValue ? selectedFocusValue : null);
  const inspectorTags = useMemo(() => {
    const domainKey = (selectedSystem?.domain ?? selectedFocusValue ?? "").toString().toLowerCase();
    if (focusType === "goal") return DOMAIN_ALE_TAGS.goal;
    return DOMAIN_ALE_TAGS[domainKey] ?? DOMAIN_ALE_TAGS.default;
  }, [selectedSystem, selectedFocusValue, focusType]);
  const inspectorName = selectedSystem?.label ?? (selectedFocusValue ? `${selectedFocusValue} lens` : null);
  const inspectorDomain = selectedSystem?.domain ?? selectedFocusValue ?? null;

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
      const built = buildLivingMapData(json);
      setGraphData(built);
      setGraphSource("live");
      setGraphSnapshotLabel(null);
      debugTwinLog("graph:loaded", { nodes: built.nodes.length, edges: built.edges.length });
    } catch (err) {
      debugTwinLog("graph:error", err);
      setGraphError(getErrorMessage(err, "Failed to load graph data."));
      setGraphData(null);
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
      setGraphRevealed(true);
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
    graphTelemetry.trackFocus(graphFocus, selectedFocusValue ? { value: selectedFocusValue } : undefined);
  }, [graphTelemetry, graphFocus, selectedFocusValue]);

  useEffect(() => {
    graphTelemetry.trackMode(graphViewMode);
  }, [graphTelemetry, graphViewMode]);

  useEffect(() => {
    graphTelemetry.trackStage(revealStage);
  }, [graphTelemetry, revealStage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLeft = window.localStorage.getItem(LEFT_RAIL_STORAGE_KEY);
    const storedRight = window.localStorage.getItem(RIGHT_RAIL_STORAGE_KEY);
    if (storedLeft) setLeftRailCollapsed(storedLeft === "1");
    if (storedRight) setRightRailCollapsed(storedRight === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LEFT_RAIL_STORAGE_KEY, leftRailCollapsed ? "1" : "0");
  }, [leftRailCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RIGHT_RAIL_STORAGE_KEY, rightRailCollapsed ? "1" : "0");
  }, [rightRailCollapsed]);

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

  const handleLeftRailToggle = () => {
    setLeftRailCollapsed((prev) => {
      const next = !prev;
      logTelemetry("digital_twin.rail_toggle", { rail: "left", collapsed: next });
      return next;
    });
  };

  const handleRightRailToggle = () => {
    setRightRailCollapsed((prev) => {
      const next = !prev;
      logTelemetry("digital_twin.rail_toggle", { rail: "right", collapsed: next });
      return next;
    });
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
      {focusPulse ? (
        <GraphControlPanel title="Focus Pulse">
          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Systems in lens</dt>
              <dd className="font-semibold text-slate-900">{focusPulse.systems}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Integrations</dt>
              <dd className="font-semibold text-slate-900">{focusPulse.integrations}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Overlap index</dt>
              <dd className="font-semibold text-slate-900">{focusPulse.overlap}</dd>
            </div>
          </dl>
        </GraphControlPanel>
      ) : null}
    </div>
  );

  const rightRailPanels = (
    <div className="space-y-4">
      <GraphSequencerPanel
        sequence={sequence}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        activePhase={activePhase}
        onSimulate={(phase) => handlePhaseChange(phase)}
        onTogglePlayback={handlePlaybackToggle}
        isPlaying={isPlaying}
      />
      <NodeInspector nodeName={inspectorName} domain={inspectorDomain} tags={inspectorTags} />
    </div>
  );

  const railStateKey = `${leftRailCollapsed ? "1" : "0"}-${rightRailCollapsed ? "1" : "0"}`;
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

  if (DIGITAL_TWIN_DENOISE_MODE) {
    const denoiseView = (
      <Fragment>
        <div className={isEmbed ? "px-4 py-6" : "px-6 pt-4 pb-8"}>
          {statsError ? (
            <div className="mb-4">
              <ErrorBanner message={statsError} onRetry={loadStats} />
            </div>
          ) : null}
          <div className="mb-6 rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Digital Twin</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
              <span>Enterprise OMS Transformation Graph - v{DIGITAL_TWIN_VERSION}</span>
              <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
                Focus: {selectedFocusValue ? selectedFocusValue : "None selected"}
              </span>
            </div>
          </div>
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
          <div className="flex gap-4">
            <Rail side="left" collapsed={leftRailCollapsed} onToggle={handleLeftRailToggle} title="Data">
              <div className="space-y-4 text-sm text-white">
                <div className="space-y-2">
                  <button type="button" onClick={handleLoadLiveData} className="w-full rounded-xl border border-white/20 px-3 py-2 text-left font-semibold transition hover:bg-white/10">
                    Load Live Data
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSnapshotClick}
                    className="w-full rounded-xl border border-white/20 px-3 py-2 text-left font-semibold transition hover:bg-white/10"
                  >
                    Load Snapshot (.json)
                  </button>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                  <p className="font-semibold uppercase tracking-[0.3em] text-white/60">Current Source</p>
                  <p className="mt-1 text-sm text-white">
                    {graphSource === "snapshot" ? graphSnapshotLabel ?? "Snapshot" : graphSource === "live" ? "Live (API)" : "Not loaded"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                  <p className="font-semibold uppercase tracking-[0.3em] text-white/60">ALE Context</p>
                  <p className="mt-1 text-sm text-white">{aleContext ? "Connected" : "Initializing..."}</p>
                </div>
              </div>
            </Rail>
            <div className="flex-1">
              <Stage padded={false}>
                <div className="border-b border-white/10 px-6 py-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Systems - Integrations</p>
                      <h2 className="text-2xl font-semibold">Harmonized enterprise map</h2>
                    </div>
                    <div className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/80">{graphViewMode.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex-1 p-4">
                  <div className="rounded-2xl border border-white/10 bg-[#10101c] p-3">
                    {graphLoading && <div className="py-40 text-center text-sm text-white/70">Loading digital twin map...</div>}
                    {!graphLoading && hasGraph ? (
                      <GraphCanvas
                        nodes={livingMapData.nodes}
                        edges={livingMapData.edges}
                        focus={graphFocus}
                        focusLabel={focusLabel}
                        focusSummary={focusSummary}
                        viewMode={graphViewMode}
                        stage={revealStage}
                        highlightNodeIds={highlightNodeIds}
                        selectedNodeId={selectedSystemId}
                        onNodeSelect={handleGraphNodeSelect}
                        onViewModeChange={handleGraphViewModeChange}
                        onStageChange={handleRevealStageChange}
                        projectId={projectId}
                        height={720}
                        sequence={sequence}
                        scenarioPhase={activePhase}
                        showCanvasControls={false}
                        showIntegrationOverlay={flowStep === "integration"}
                      />
                    ) : (
                      !graphLoading && <div className="py-36 text-center text-sm text-white/70">No harmonized systems yet. Import data to populate the graph.</div>
                    )}
                  </div>
                </div>
              </Stage>
            </div>
            <Rail side="right" collapsed={rightRailCollapsed} onToggle={handleRightRailToggle} title="Option Menu">
              <OptionMenu onAction={handleOptionMenuAction} />
            </Rail>
          </div>
        </div>
        <SequencePromptOverlay {...sequencePromptProps} />
      </Fragment>
    );
    return denoiseView;
  }
  return (
    <Fragment>
      <div className={isEmbed ? "px-4 py-6" : "px-6 pt-2 pb-6"}>
        {statsError && (
          <div className="mb-4">
            <ErrorBanner message={statsError} onRetry={loadStats} />
          </div>
      )}
      <section className="space-y-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Digital Twin graph</p>
              <p className="text-xs text-slate-500">Fade-in reveals and progressive focus transitions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600 shadow-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">View Mode</p>
              <p className="font-semibold text-slate-900">{graphViewMode}</p>
            </div>
          </div>

          {graphError && (
            <Card className="border-rose-200 bg-rose-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-rose-700">{graphError}</p>
                <button
                  type="button"
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                  onClick={loadGraph}
                >
                  Retry
                </button>
              </div>
            </Card>
          )}

          <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-lg min-h-[720px] mt-6">
            {graphLoading && <div className="py-36 text-center text-sm text-slate-500">Loading digital twin map...</div>}
            {!graphLoading && hasGraph && (
              <GraphCanvas
                nodes={livingMapData.nodes}
                edges={livingMapData.edges}
                focus={graphFocus}
                focusLabel={focusLabel}
                focusSummary={focusSummary}
                viewMode={graphViewMode}
                stage={revealStage}
                highlightNodeIds={highlightNodeIds}
                selectedNodeId={selectedSystemId}
                onNodeSelect={handleGraphNodeSelect}
                onViewModeChange={handleGraphViewModeChange}
                onStageChange={handleRevealStageChange}
                projectId={projectId}
                height={720}
                sequence={sequence}
                scenarioPhase={activePhase}
                showCanvasControls={false}
                showIntegrationOverlay={flowStep === "integration"}
              />
            )}
            {!graphLoading && !hasGraph && (
              <div className="py-20 text-center text-sm text-slate-500">No harmonized systems yet. Import data or run onboarding to populate the graph.</div>
            )}
          </div>

          {flowStep === "insight" && insightMessage && (
            <div className="space-y-3" data-testid="digital-twin-action-invitation">
              <p className="text-sm font-semibold text-slate-900">Action invitation</p>
              <div className="grid gap-3 md:grid-cols-3">
                {ACTIONS.map((action) => (
                  <Card key={action.key} className="flex flex-col justify-between border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{action.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logTelemetry("digital_twin.action_selected", { action: action.key, role });
                        window.location.href = action.href(projectId);
                      }}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {action.cta}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3 border-slate-200 bg-white shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Recognition</p>
            <p className="text-sm text-slate-800">
              &ldquo;Here&apos;s the full picture — every system and integration you&apos;ve shared, harmonized across your enterprise.&rdquo;
            </p>
            {hasStats && (
              <div className="grid grid-cols-2 gap-2 text-[0.7rem] text-slate-600">
                <div>
                  <p className="text-slate-500">Systems</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.systemsFuture)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Integrations</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.integrationsFuture)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Domains</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.domainsDetected)}</p>
                </div>
                <div>
                  <p className="text-slate-500">View mode</p>
                  <p className="font-semibold text-slate-900 capitalize">{graphViewMode}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-4 border-emerald-200 bg-emerald-50">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-600">Guided focus</p>
              <p className="text-sm text-emerald-900">{promptsByRole[flowStep]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {FOCUS_LENSES.map((lens) => (
                <button
                  key={lens.type}
                  type="button"
                  className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold ${
                    focusType === lens.type ? "bg-emerald-600 text-white shadow" : "bg-white text-emerald-800"
                  }`}
                  onClick={() => {
                    setFocusType(lens.type);
                    logTelemetry("digital_twin.focus_mode_changed", { mode: lens.type });
                  }}
                >
                  {lens.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-emerald-800">{focusSummary}</p>
            {renderFlowButtons()}
          </Card>
        </div>
      </section>
      </div>
      <SequencePromptOverlay {...sequencePromptProps} />
    </Fragment>
  );
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
