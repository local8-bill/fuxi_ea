"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { graphSectionLabelClass, GraphControlPanel, GraphControlButton } from "@/components/graph/GraphLayoutSection";
import { NodeInspector } from "@/components/graph/NodeInspector";
import { type GraphTimelineBand, type PhaseInsight } from "@/components/graph/GraphSimulationControls";
import { GraphSequencerPanel, GraphEventConsole, type GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { GraphPredictivePanel } from "@/components/graph/GraphPredictivePanel";
import { GraphFinancialSummary, type PhaseFinancialSummary } from "@/components/graph/GraphFinancialSummary";
import { GraphTransitionCompare, type TransitionPath } from "@/components/graph/GraphTransitionCompare";
import sequencerDataset from "@/data/sequencer.json";
import roiSummaryData from "@/data/roi_tcc_summary.json";
import type { LivingMapData, LivingNode } from "@/types/livingMap";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useUserGenome } from "@/lib/context/userGenome";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import { AdaptiveSignalsPanel } from "@/components/learning/AdaptiveSignalsPanel";
import type { LearningSnapshot } from "@/hooks/useLearningSnapshot";
import type { GraphFocus, GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";
import { useGraphTelemetry } from "@/hooks/useGraphTelemetry";
import { usePredictiveScenarios } from "@/hooks/usePredictiveScenarios";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
}

type FlowStep = "domain" | "system" | "integration" | "insight";
type FocusType = "platform" | "domain" | "goal";

interface Props {
  projectId: string;
  onStatsUpdate?: (stats: DigitalEnterpriseStats | null) => void;
  learningSnapshot?: LearningSnapshot | null;
}

const DIGITAL_TWIN_VERSION = "0.2";
const DIGITAL_TWIN_TIMELINE: GraphTimelineBand[] = [
  { id: "fy26", label: "FY26", summary: "Stabilize foundation" },
  { id: "fy27", label: "FY27", summary: "Unify experiences" },
  { id: "fy28", label: "FY28", summary: "Unlock adaptive network" },
];
type SequencerItem = GraphSequencerItem;
const sequencerData = sequencerDataset as SequencerItem[];

const ACTIONS = [
  {
    key: "redundancy",
    title: "Analyze Redundancies",
    summary: "Surface overlapping systems and pathways adding unnecessary run costs.",
    cta: "Open Redundancy Map",
    href: (projectId: string) => `/project/${projectId}/experience?scene=digital&lens=redundancy`,
  },
  {
    key: "roi",
    title: "Assess ROI",
    summary: "Estimate ROI impact for this focus area and capture it as a scenario.",
    cta: "Open ROI Dashboard",
    href: (projectId: string) => `/project/${projectId}/experience?scene=roi`,
  },
  {
    key: "modernization",
    title: "Simulate Modernization",
    summary: "Model the impact of retiring or upgrading systems via the sequencer.",
    cta: "Open Sequencer",
    href: (projectId: string) => `/project/${projectId}/experience?scene=sequencer`,
  },
];

const FOCUS_LENSES: Array<{ type: FocusType; label: string; helper: string }> = [
  { type: "platform", label: "By Platform", helper: "Cluster systems by ERP/commerce stack." },
  { type: "domain", label: "By Domain", helper: "Highlight value streams + business units." },
  { type: "goal", label: "By Goal", helper: "Trace objectives such as modernization or ROI." },
];

const GRAPH_VIEW_MODES: Array<{ id: GraphViewMode; label: string; helper: string }> = [
  { id: "systems", label: "Systems", helper: "Systems + integrations." },
  { id: "domain", label: "Domain", helper: "Value stream halos." },
  { id: "roi", label: "ROI", helper: "Impact vs cost gradients." },
  { id: "sequencer", label: "Sequencer", helper: "Timeline overlays." },
  { id: "capabilities", label: "Capabilities", helper: "Hierarchy & scoring." },
];

const GRAPH_REVEAL_STAGES: Array<{ id: GraphRevealStage; label: string; tone: string; summary: string }> = [
  { id: "orientation", label: "Orientation", tone: "Calm", summary: "Domains only." },
  { id: "exploration", label: "Exploration", tone: "Curious", summary: "Nodes per domain." },
  { id: "connectivity", label: "Connectivity", tone: "Energized", summary: "All systems + edges." },
  { id: "insight", label: "Insight", tone: "Analytical", summary: "ROI / TCC overlays." },
];
const SHOW_VIEW_MODE_PANEL = true;

const PLATFORM_OPTIONS = ["ERP", "Commerce", "CRM", "Data", "Supply Chain"];
const GOAL_OPTIONS = ["Modernization", "Cost", "ROI"];

const GOAL_HEURISTICS: Record<string, (node: LivingNode) => number> = {
  modernization: (node) => 100 - (node.aiReadiness ?? 50),
  cost: (node) => node.integrationCount ?? 0,
  roi: (node) => node.roiScore ?? 0,
};

const DOMAIN_ALE_TAGS: Record<string, string[]> = {
  commerce: ["inventory_visibility_dependency", "temporary_integration_path"],
  finance: ["foundational_system_coupling", "parallel_legacy_enhancement"],
  supply: ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  "supply chain": ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  goal: ["effort_based_option_pruning"],
  default: ["governance_alignment_checkpoint"],
};

function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0";
  return value.toLocaleString();
}

function stableScore(id: string, base: number, spread: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return base + normalized * spread;
}

function buildLivingMapData(view: { nodes?: any[]; edges?: any[] }): LivingMapData {
  const nodes = Array.isArray(view.nodes) ? view.nodes : [];
  const edges = Array.isArray(view.edges) ? view.edges : [];
  const degree = new Map<string, number>();
  edges.forEach((edge: any) => {
    const src = edge?.sourceId ?? edge?.source;
    const tgt = edge?.targetId ?? edge?.target;
    if (src) degree.set(src, (degree.get(src) ?? 0) + 1);
    if (tgt) degree.set(tgt, (degree.get(tgt) ?? 0) + 1);
  });

  const livingNodes: LivingMapData["nodes"] = nodes.map((node: any) => {
    const id = String(node?.id ?? "");
    const label = String(node?.label ?? node?.name ?? "Unknown");
    return {
      id,
      label,
      domain: node?.domain ?? null,
      integrationCount: degree.get(id) ?? 0,
      state: node?.state,
      health: stableScore(id, 55, 30),
      aiReadiness: stableScore(`${id}-ai`, 45, 45),
      roiScore: stableScore(`${id}-roi`, 35, 50),
    };
  });

  const livingEdges: LivingMapData["edges"] = edges.map((edge: any, idx: number) => ({
    id: String(edge?.id ?? `edge-${idx}`),
    source: String(edge?.sourceId ?? edge?.source ?? ""),
    target: String(edge?.targetId ?? edge?.target ?? ""),
    weight: 1,
    kind: "api",
    confidence: typeof edge?.confidence === "number" ? edge.confidence : undefined,
    inferred: Boolean(edge?.data?.inferred || edge?.inferred),
  }));

  return { nodes: livingNodes, edges: livingEdges };
}

function buildInsight(role: string, motivation: string, systemName: string, peerName: string, tone: string) {
  const base = role.toLowerCase().includes("cfo")
    ? `From a finance lens, ${systemName} and ${peerName} create duplicate run costs.`
    : `The ${systemName} → ${peerName} path is carrying redundant flows.`;
  const toneSuffix = tone === "empathetic" ? " I can soften the rollout if you need." : tone === "analytical" ? " Let's quantify the delta next." : " Ready to act when you are.";
  return `${base} Aligning this connection accelerates ${motivation.toLowerCase()}.${toneSuffix}`;
}

export function DigitalEnterpriseClient({ projectId, onStatsUpdate, learningSnapshot }: Props) {
  const { log: logTelemetry } = useTelemetry("digital_twin", { projectId });
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";
  const { role, motivation, interactionStyle, preferredTone } = useUserGenome();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [graphDataMode, setGraphDataMode] = useState<"snapshot" | "live" | null>(null);
  const [graphMetadata, setGraphMetadata] = useState<{ captured_at?: string; source?: string; scenario?: string; file?: string } | null>(null);
  const [refreshingSnapshot, setRefreshingSnapshot] = useState(false);
  const [snapshotRefreshError, setSnapshotRefreshError] = useState<string | null>(null);

  const [graphRevealed, setGraphRevealed] = useState(false);
  const [graphViewMode, setGraphViewMode] = useState<GraphViewMode>("systems");
  const [revealStage, setRevealStage] = useState<GraphRevealStage>("orientation");
  const [activePhase, setActivePhase] = useState(DIGITAL_TWIN_TIMELINE[0]?.id ?? "fy26");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2600);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const [sequence, setSequence] = useState<SequencerItem[]>(sequencerData);
  const [dragId, setDragId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const [flowStep, setFlowStep] = useState<FlowStep>("domain");
  const flowStepRef = useRef<FlowStep>("domain");
  const [focusType, setFocusType] = useState<FocusType>("domain");
  const [selectedFocusValue, setSelectedFocusValue] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<{ edgeId: string; peerLabel: string } | null>(null);
  const [insightMessage, setInsightMessage] = useState<string | null>(null);
  const focusPromptLogged = useRef(false);
  const actionsLogged = useRef(false);
  const [leftLaneCollapsed, setLeftLaneCollapsed] = useState(false);
  const [rightLaneCollapsed, setRightLaneCollapsed] = useState(false);
  const [leftLaneRendered, setLeftLaneRendered] = useState(true);
  const [rightLaneRendered, setRightLaneRendered] = useState(true);
  const [showIntegrationOverlay, setShowIntegrationOverlay] = useState(true);

  const aiInsights = useAIInsights(graphData?.nodes ?? []);
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
  const predictiveScenarios = usePredictiveScenarios(phaseInsights, activePhase);
  const activeScenario = useMemo(
    () => predictiveScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [predictiveScenarios, selectedScenarioId],
  );
  const financialPhases = useMemo<PhaseFinancialSummary[]>(() => {
    const raw = roiSummaryData.phases ?? [];
    return DIGITAL_TWIN_TIMELINE.map((band, index) => {
      const summary = raw[index] ?? raw[raw.length - 1] ?? {
        costToday: 0,
        transitionCost: 0,
        valueTomorrow: 0,
        roi: 0,
        tcc: 0,
      };
      return {
        id: band.id,
        label: summary.label ?? band.label,
        costToday: summary.costToday ?? 0,
        transitionCost: summary.transitionCost ?? 0,
        valueTomorrow: summary.valueTomorrow ?? 0,
        roi: summary.roi ?? 0,
        tcc: summary.tcc ?? 0,
      };
    });
  }, []);
  const transitionPaths = useMemo<TransitionPath[]>(() => (roiSummaryData.paths ?? []) as TransitionPath[], []);
  const [activeTransitionPathId, setActiveTransitionPathId] = useState<string | null>(() => transitionPaths[0]?.id ?? null);
  const logLearningEvent = useCallback((code: string, details?: Record<string, unknown>) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} · ${code}`, ...prev].slice(0, 6));
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
      emitAdaptiveEvent("ux_mode:set", { mode: "digital-phase", phase });
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
  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = predictiveScenarios.find((item) => item.id === scenarioId);
    if (scenario) {
      logTelemetry("digital_twin.scenario_selected", { scenario: scenario.id, phase: scenario.phase });
      logLearningEvent("LE-008", { scenario: scenario.id });
    }
  };
  const handleScenarioActivate = (scenarioId: string) => {
    const scenario = predictiveScenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    handlePhaseChange(scenario.phase);
    logTelemetry("digital_twin.scenario_applied", {
      scenario: scenario.id,
      roiDelta: scenario.roiDelta,
      tccDelta: scenario.tccDelta,
      timelineDelta: scenario.timelineDeltaMonths,
    });
    logLearningEvent("LE-009", { scenario: scenario.id });
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
  const hasGraph = (livingMapData.nodes.length ?? 0) > 0;
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

  useEffect(() => {
    logTelemetry("digital_twin.render_start", { projectId, version: DIGITAL_TWIN_VERSION });
    logTelemetry("workspace_view", { projectId, version: DIGITAL_TWIN_VERSION });
  }, [projectId, logTelemetry]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    onStatsUpdate?.(null);
    try {
      const res = await fetch(`/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Stats load failed ${res.status}: ${text}`);
      }
      const json = (await res.json()) as DigitalEnterpriseStats;
      setStats(json);
      onStatsUpdate?.(json);
    } catch (err: any) {
      setStatsError(err?.message ?? "Failed to load digital twin metrics.");
      setStats(null);
      onStatsUpdate?.(null);
    } finally {
      setStatsLoading(false);
    }
  }, [projectId, onStatsUpdate]);

  const loadGraph = useCallback(async (mode: "snapshot" | "live") => {
    setGraphLoading(true);
    setGraphError(null);
    const fallback = async () => {
      try {
        const resLegacy = await fetch(`/api/digital-enterprise/view?project=${encodeURIComponent(projectId)}&mode=all`, { cache: "no-store" });
        if (!resLegacy.ok) {
          const text = await resLegacy.text().catch(() => resLegacy.statusText);
          throw new Error(text || `Legacy view failed (${resLegacy.status})`);
        }
        const json = await resLegacy.json();
        setGraphMetadata({
          source: mode === "live" ? "legacy-live" : "legacy-snapshot",
          captured_at: new Date().toISOString(),
          scenario: mode === "live" ? "Live fallback" : "Snapshot fallback",
        });
        setGraphData(buildLivingMapData(json));
        setGraphDataMode(mode);
      } catch (legacyErr: any) {
        setGraphError(legacyErr?.message ?? "Failed to load graph data.");
        setGraphData(null);
        setGraphDataMode(null);
      }
    };

    try {
      const res = await fetch(`/api/graph/snapshot?project=${encodeURIComponent(projectId)}&mode=${mode}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Graph load failed ${res.status}: ${text}`);
      }
      const json = await res.json();
      setGraphMetadata({
        ...json.metadata,
        source: json.source ?? mode,
        file: json.file,
      });
      setGraphData(buildLivingMapData(json));
      setGraphDataMode(mode);
    } catch (err: any) {
      await fallback();
    } finally {
      setGraphLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSnapshotRefresh = useCallback(async () => {
    setRefreshingSnapshot(true);
    setSnapshotRefreshError(null);
    try {
      const res = await fetch("/api/graph/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: projectId, scenario: "Digital Twin Refresh" }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Snapshot refresh failed");
      }
      await loadGraph("snapshot");
    } catch (err: any) {
      setSnapshotRefreshError(err?.message ?? "Snapshot refresh failed.");
    } finally {
      setRefreshingSnapshot(false);
    }
  }, [projectId, loadGraph]);

  useEffect(() => {
    if (focusPromptLogged.current || graphLoading) return;
    focusPromptLogged.current = true;
    logTelemetry("digital_twin.focus_prompt_shown", { options: FOCUS_LENSES.map((lens) => lens.type) });
  }, [graphLoading, logTelemetry]);

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
  }, []);

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
    if (!leftLaneCollapsed) {
      setLeftLaneRendered(true);
      return;
    }
    const timer = window.setTimeout(() => setLeftLaneRendered(false), 280);
    return () => window.clearTimeout(timer);
  }, [leftLaneCollapsed]);

  useEffect(() => {
    if (!rightLaneCollapsed) {
      setRightLaneRendered(true);
      return;
    }
    const timer = window.setTimeout(() => setRightLaneRendered(false), 280);
    return () => window.clearTimeout(timer);
  }, [rightLaneCollapsed]);

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

  const handleSystemSelect = (systemId: string) => {
    const system = livingMapData.nodes.find((node) => node.id === systemId);
    if (!system) return;
    setSelectedSystemId(systemId);
    setSelectedIntegration(null);
    setInsightMessage(null);
    const domainKey = (system.domain as string | undefined)?.toLowerCase() ?? "";
    const tagSet = DOMAIN_ALE_TAGS[domainKey] ?? DOMAIN_ALE_TAGS.default;
    sendReasoningEvent(systemId, "system_selected", tagSet);
    advanceFlow("integration");
  };
  const handleTransitionPathSelect = (path: TransitionPath) => {
    setActiveTransitionPathId(path.id);
    logTelemetry("digital_twin.transition_path_selected", { path: path.id, roi: path.roi, tcc: path.tcc });
    logLearningEvent("LE_PATH_SELECTED", { path: path.id, roi: path.roi, tcc: path.tcc });
  };

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
    return `Highlighting ${selectedSystem.label} ↔ ${selectedIntegration.peerLabel}. Ready for the next move?`;
  }, [selectedFocusValue, focusType, selectedSystem, selectedIntegration]);

  useEffect(() => {
    if (flowStep === "insight" && insightMessage && !actionsLogged.current) {
      logTelemetry("digital_twin.actions_shown", { options: ACTIONS.map((action) => action.key), role });
      actionsLogged.current = true;
    }
    if (flowStep !== "insight") actionsLogged.current = false;
  }, [flowStep, insightMessage, role, logTelemetry]);

  const gridTemplateColumns = useMemo(() => {
    if (!isDesktop) return undefined;
    const leftColumn = leftLaneCollapsed ? "0px" : "240px";
    const centerColumn = "minmax(0,1fr)";
    const rightColumn = rightLaneCollapsed ? "0px" : "minmax(320px,1fr)";
    return [leftColumn, centerColumn, rightColumn].join(" ");
  }, [isDesktop, leftLaneCollapsed, rightLaneCollapsed]);
  const showLeftAuxPanel = leftLaneCollapsed && !leftLaneRendered;
  const showRightAuxPanel = rightLaneCollapsed && !rightLaneRendered;

  const renderFlowButtons = () => {
    switch (flowStep) {
      case "domain": {
        const options =
          focusType === "platform" ? PLATFORM_OPTIONS : focusType === "goal" ? GOAL_OPTIONS : domainSuggestions;
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

  const leftRailContent = (
    <div className="space-y-4">
      {SHOW_VIEW_MODE_PANEL ? (
        <GraphControlPanel title="View Mode">
          {GRAPH_VIEW_MODES.map((modeOption) => (
            <GraphControlButton
              key={modeOption.id}
              active={graphViewMode === modeOption.id}
              label={modeOption.label}
              helper={modeOption.helper}
              onClick={() => handleGraphViewModeChange(modeOption.id)}
            />
          ))}
        </GraphControlPanel>
      ) : null}

      <GraphControlPanel title="Guided Focus">
        {FOCUS_LENSES.map((lens) => (
          <GraphControlButton
            key={lens.type}
            active={focusType === lens.type}
            label={lens.label}
            helper={lens.helper}
            onClick={() => setFocusType(lens.type)}
          />
        ))}
        <p className="text-xs text-neutral-500">{focusSummary}</p>
        <div className="space-y-2">{renderFlowButtons()}</div>
      </GraphControlPanel>

      <GraphControlPanel title="Reveal States">
        {GRAPH_REVEAL_STAGES.map((stageOption) => (
          <GraphControlButton
            key={stageOption.id}
            active={revealStage === stageOption.id}
            label={`${stageOption.label} · ${stageOption.tone}`}
            helper={stageOption.summary}
            onClick={() => handleRevealStageChange(stageOption.id)}
          />
        ))}
      </GraphControlPanel>
    </div>
  );


  const rightRailPanels = (
    <>
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
      <GraphEventConsole events={eventLog} emptyMessage="Interact with the sequencer or graph to log learning." />
      <GraphPredictivePanel scenarios={predictiveScenarios} selectedScenarioId={selectedScenarioId} onSelect={handleScenarioSelect} onActivate={handleScenarioActivate} />
      <GraphFinancialSummary phases={financialPhases} activePhase={activePhase} />
      {transitionPaths.length ? <GraphTransitionCompare paths={transitionPaths} activePathId={activeTransitionPathId} onSelect={handleTransitionPathSelect} /> : null}
    </>
  );

  return (
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
          </div>

          <section className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-4 text-slate-800 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={clsx(graphSectionLabelClass, "text-slate-500")}>Layout Controls</p>
                <p className="text-sm text-slate-600">Collapse focus/insight lanes or refresh the data source.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm font-semibold transition",
                    graphDataMode === "snapshot" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600",
                  )}
                  disabled={graphLoading || refreshingSnapshot}
                  onClick={() => loadGraph("snapshot")}
                >
                  Load Snapshot
                </button>
                <button
                  type="button"
                  className={clsx(
                    "rounded-full border px-3 py-1 text-sm font-semibold transition",
                    graphDataMode === "live" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600",
                  )}
                  disabled={graphLoading || refreshingSnapshot}
                  onClick={() => loadGraph("live")}
                >
                  Load Live Data
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-60"
                  onClick={handleSnapshotRefresh}
                  disabled={graphLoading || refreshingSnapshot}
                >
                  Refresh Snapshot
                </button>
              </div>
              <div className="text-xs text-slate-500">
                {graphLoading ? (
                  <span>Loading {graphDataMode ?? "snapshot"} dataset…</span>
                ) : graphMetadata ? (
                  <span>
                    {graphDataMode === "live" ? "Live graph" : "Snapshot"} ·{" "}
                    {graphMetadata.captured_at ? new Date(graphMetadata.captured_at).toLocaleString() : "timestamp unknown"}
                    {graphMetadata.scenario ? ` · ${graphMetadata.scenario}` : null}
                  </span>
                ) : (
                  <span>No dataset loaded yet. Use the buttons above to pull a snapshot or live view.</span>
                )}
                {snapshotRefreshError ? <span className="ml-2 text-rose-500">{snapshotRefreshError}</span> : null}
              </div>
            </div>
          </section>

          <div className="relative">
            <div
              className={clsx("grid gap-6", "transition-[grid-template-columns] duration-300 ease-out", !isDesktop ? "auto-rows-auto" : undefined)}
              style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
            >
              <div
                className={clsx(
                  "min-w-0 overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                  leftLaneCollapsed ? "-translate-x-2 opacity-0" : "opacity-100",
                  !isDesktop ? "order-1" : undefined,
                )}
                aria-hidden={leftLaneCollapsed && !leftLaneRendered}
                style={{ pointerEvents: leftLaneCollapsed ? "none" : undefined }}
              >
                {leftLaneRendered ? leftRailContent : null}
              </div>

              <div className={clsx("space-y-4 min-w-0", !isDesktop ? "order-2" : undefined)}>
                {graphError && (
                  <Card className="border-rose-200 bg-rose-50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-rose-700">{graphError}</p>
                      <button
                        type="button"
                        className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                        onClick={() => loadGraph(graphDataMode ?? "snapshot")}
                      >
                        Retry
                      </button>
                    </div>
                  </Card>
                )}
                <div
                  className={clsx(
                    "rounded-3xl border bg-white p-2 shadow-lg min-h-[820px] transition-opacity duration-700",
                    showIntegrationOverlay ? "border-emerald-200" : "border-slate-200",
                    graphRevealed ? "opacity-100" : "opacity-0",
                  )}
                >
                  {graphLoading && <div className="py-36 text-center text-sm text-slate-500">Loading digital twin map…</div>}
                  {!graphLoading && hasGraph && (
                    <GraphCanvas
                      nodes={livingMapData.nodes}
                      edges={livingMapData.edges}
                      focus={graphFocus}
                      focusLabel={selectedFocusValue}
                      focusSummary={focusSummary}
                      viewMode={graphViewMode}
                      stage={revealStage}
                      highlightNodeIds={highlightNodeIds ?? undefined}
                      selectedNodeId={selectedSystemId}
                      onNodeSelect={(nodeId) => {
                        if (!nodeId) {
                          setSelectedSystemId(null);
                          setSelectedIntegration(null);
                          return;
                        }
                        handleSystemSelect(nodeId);
                      }}
                      onViewModeChange={handleGraphViewModeChange}
                      onStageChange={handleRevealStageChange}
                      height={isEmbed ? 560 : 820}
                      projectId={projectId}
                      scenarioPhase={activeScenario?.phase ?? null}
                      sequence={sequence}
                      showIntegrationOverlay={showIntegrationOverlay}
                      domainColumns={2}
                      systemColumns={2}
                      showCanvasControls={false}
                      domainWidth={760}
                      domainHorizontalGap={36}
                      domainVerticalGap={180}
                      domainPaddingX={28}
                      domainPaddingY={44}
                      systemCellHeight={80}
                      domainMinHeight={580}
                      systemColumnGap={16}
                      systemColumns={2}
                      fitViewPadding={0.12}
                    />
                  )}
                  {!graphLoading && !hasGraph && (
                    <div className="py-20 text-center text-sm text-slate-500">No harmonized systems yet. Import data or run onboarding to populate the graph.</div>
                  )}
                </div>
              </div>

              <div
                className={clsx(
                  "min-w-0 overflow-hidden transition-[opacity,transform] duration-300 ease-out",
                  rightLaneCollapsed ? "translate-x-2 opacity-0" : "opacity-100",
                  !isDesktop ? "order-3" : undefined,
                )}
                aria-hidden={rightLaneCollapsed && !rightLaneRendered}
                style={{ pointerEvents: rightLaneCollapsed ? "none" : undefined }}
              >
                {rightLaneRendered ? <div className="space-y-4">{rightRailPanels}</div> : null}
              </div>
            </div>

            {isDesktop ? (
              <>
                <button
                  type="button"
                  className={clsx(
                    "absolute left-0 top-8 hidden -translate-x-1/2 rounded-full border border-slate-200 bg-white/85 px-2 py-1 text-sm font-semibold text-slate-600 shadow hover:bg-white",
                    "lg:flex items-center justify-center",
                  )}
                  onClick={() => setLeftLaneCollapsed((prev) => !prev)}
                  aria-label={leftLaneCollapsed ? "Expand focus rail" : "Collapse focus rail"}
                >
                  {leftLaneCollapsed ? "›" : "‹"}
                </button>
                <button
                  type="button"
                  className={clsx(
                    "absolute right-0 top-8 hidden translate-x-1/2 rounded-full border border-slate-200 bg-white/85 px-2 py-1 text-sm font-semibold text-slate-600 shadow hover:bg-white",
                    "lg:flex items-center justify-center",
                  )}
                  onClick={() => setRightLaneCollapsed((prev) => !prev)}
                  aria-label={rightLaneCollapsed ? "Expand insight rail" : "Collapse insight rail"}
                >
                  {rightLaneCollapsed ? "‹" : "›"}
                </button>
              </>
            ) : null}
          </div>

          {showLeftAuxPanel ? <div className="space-y-4">{leftRailContent}</div> : null}
          {showRightAuxPanel ? <div className="space-y-4">{rightRailPanels}</div> : null}

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
            <p className="text-sm text-slate-800">
              “Here’s the full picture — every system and integration you’ve shared, harmonized across your enterprise.”
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
              </div>
            )}
          </Card>
          <AdaptiveSignalsPanel snapshot={learningSnapshot} title="Adaptive Signals" subtitle="Digital twin" />
        </div>

        {focusPulse && (
          <Card className="space-y-3 border-emerald-200 bg-white shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-600">Focus Pulse</p>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                Systems highlighted: <span className="font-semibold">{focusPulse.systems}</span>
              </p>
              <p>
                Integrations in lens: <span className="font-semibold">{focusPulse.integrations}</span>
              </p>
              <p>
                Overlap index: <span className="font-semibold">{focusPulse.overlap}</span>
              </p>
            </div>
          </Card>
        )}
      </section>
    </div>
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
