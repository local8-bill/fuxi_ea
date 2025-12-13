"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type FormEvent } from "react";
import clsx from "clsx";
import { UXShellLayout } from "@/components/uxshell/UXShellLayout";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import graphData from "@/data/graph/oms_transformation.json";
import roiMetricsData from "@/data/roi_tcc.json";
import sequencerDataset from "@/data/sequencer.json";
import { useStoreData } from "@/hooks/useStoreData";
import { NodeInspector } from "@/components/graph/NodeInspector";
import { monitorGraphData, verifyLatestBackup } from "@/agents/dx/liveMonitor";
import {
  GraphSimulationControls,
  PhaseInsightStrip,
  riskState,
  type GraphTimelineBand,
  type PhaseInsight,
} from "@/components/graph/GraphSimulationControls";
import { GraphSequencerPanel, GraphEventConsole, type GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { GraphPredictivePanel } from "@/components/graph/GraphPredictivePanel";
import { DecisionBacklogPanel } from "@/components/graph/DecisionBacklogPanel";
import { GraphFinancialSummary, type PhaseFinancialSummary } from "@/components/graph/GraphFinancialSummary";
import { GraphTransitionCompare, type TransitionPath } from "@/components/graph/GraphTransitionCompare";
import { usePredictiveScenarios, type PredictiveScenario } from "@/hooks/usePredictiveScenarios";
import { useSequencerBridge, type IntentConfirmationContext } from "@/hooks/useSequencerBridge";
import { useDecisionBacklog, type DecisionNode } from "@/hooks/useDecisionBacklog";
import { useTransformationLens } from "@/hooks/useTransformationLens";
import roiSummaryData from "@/data/roi_tcc_summary.json";

const guidedFocusOptions = [
  { id: "domain", label: "By Domain", helper: "Clusters by business function." },
  { id: "goal", label: "By Goal", helper: "Highlights strategic objectives." },
  { id: "stage", label: "By Stage", helper: "Filters by transformation phase." },
];

const viewModes = [
  { id: "systems", label: "Systems", helper: "Systems + integrations." },
  { id: "domain", label: "Domain", helper: "Value stream halos." },
  { id: "roi", label: "ROI", helper: "Impact vs cost gradients." },
  { id: "sequencer", label: "Sequencer", helper: "Timeline overlays." },
  { id: "capabilities", label: "Capabilities", helper: "Hierarchy & scoring." },
];

const revealStages = [
  { id: "orientation", label: "Orientation", tone: "Calm", summary: "Domains only" },
  { id: "exploration", label: "Exploration", tone: "Curious", summary: "Nodes per domain" },
  { id: "connectivity", label: "Connectivity", tone: "Energized", summary: "All systems + edges" },
  { id: "insight", label: "Insight", tone: "Analytical", summary: "ROI / TCC overlays" },
];

type TimelineBand = GraphTimelineBand & { summary: string; highlight?: boolean };
type IntegrationFlow = {
  flow_id: string;
  source: string;
  system_from: string;
  system_to: string;
  env?: string;
  status?: string;
  last_seen?: string;
  latency_ms?: number;
  error_rate?: number;
  owner_team?: string;
  confidence?: number;
  direction?: "source" | "target";
};

type GraphSystem = {
  id: string;
  title: string;
  impact: number;
  stage: string;
  phase: string;
  vendors?: string[];
  aleTags?: string[];
  integrationCount?: number;
  integrationFlows?: IntegrationFlow[];
};
type GraphDomain = {
  id: string;
  title: string;
  color: string;
  regions: string[];
  systems: GraphSystem[];
  aleTags?: string[];
};
type GraphDataset = {
  timeline: TimelineBand[];
  domains: GraphDomain[];
};

type IntegrationStats = {
  domains: GraphDomain[];
  unmatched: IntegrationFlow[];
};

const normalizeKey = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type SelectedNode =
  | { kind: "domain"; domain: GraphDomain }
  | { kind: "system"; domain: GraphDomain; system: GraphSystem };

type GraphLensFilters = {
  id: string;
  label: string;
  description: string;
  hasFilters: boolean;
  shouldMuteDomain: (domain: GraphDomain) => boolean;
  shouldMuteSystem: (system: GraphSystem, domain: GraphDomain) => boolean;
};

const dataset = graphData as GraphDataset;
const roiData = roiMetricsData as Record<string, { roi: number; tcc: number; risk: number }>;
const roiSummary = roiSummaryData as { phases: PhaseFinancialSummary[]; paths: TransitionPath[] };
type SequencerItem = GraphSequencerItem;
const sequencerData = sequencerDataset as SequencerItem[];
const DOMAIN_TAGS: Record<string, string[]> = {
  commerce: ["inventory_visibility_dependency", "temporary_integration_path"],
  finance: ["foundational_system_coupling", "parallel_legacy_enhancement"],
  supply: ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  "supply chain": ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  default: ["governance_alignment_checkpoint"],
};

const timelineBands = dataset.timeline;
const domains = dataset.domains;

const domainFallbacks = dataset.domains.reduce<Record<string, Pick<GraphDomain, "color" | "regions">>>((acc, domain) => {
  acc[domain.id.toLowerCase()] = { color: domain.color, regions: domain.regions };
  return acc;
}, {});

function applyIntegrationStats(domains: GraphDomain[], flows: IntegrationFlow[]): IntegrationStats {
  if (!flows.length) {
    return {
      domains: domains.map((domain) => ({
        ...domain,
        systems: domain.systems.map((system) => ({
          ...system,
          integrationCount: system.integrationCount ?? 0,
          integrationFlows: system.integrationFlows ?? [],
        })),
      })),
      unmatched: [],
    };
  }

  const keyIndex = new Map<string, { domainId: string; systemId: string }>();
  domains.forEach((domain) => {
    domain.systems.forEach((system) => {
      const keys = [system.id, system.title, ...(system.vendors ?? [])];
      keys.forEach((value) => {
        if (!value) return;
        keyIndex.set(normalizeKey(value), { domainId: domain.id, systemId: system.id });
      });
    });
  });

  const stats = new Map<string, IntegrationFlow[]>();
  const unmatched: IntegrationFlow[] = [];

  const attach = (value: string | undefined, flow: IntegrationFlow) => {
    if (!value) return false;
    const match = keyIndex.get(normalizeKey(value));
    if (!match) return false;
    if (!stats.has(match.systemId)) stats.set(match.systemId, []);
    const direction: "source" | "target" = normalizeKey(flow.system_from) === normalizeKey(value) ? "source" : "target";
    stats.get(match.systemId)!.push({ ...flow, direction });
    return true;
  };

  flows.forEach((flow) => {
    const matchedFrom = attach(flow.system_from, flow);
    const matchedTo = attach(flow.system_to, flow);
    if (!matchedFrom && !matchedTo) {
      unmatched.push(flow);
    }
  });

  const enriched = domains.map((domain) => ({
    ...domain,
    systems: domain.systems.map((system) => ({
      ...system,
      integrationCount: stats.get(system.id)?.length ?? system.integrationCount ?? 0,
      integrationFlows: stats.get(system.id) ?? system.integrationFlows ?? [],
    })),
  }));

  return { domains: enriched, unmatched };
}

function buildGraphDatasetFromApi(data: { nodes?: any[] } | null | undefined): GraphDataset | null {
  if (!data?.nodes) return null;
  const domainPalette: Record<string, string> = {
    commerce: "#fef3c7",
    finance: "#e0f2fe",
    operations: "#e0e7ff",
    data: "#e0e7ff",
    supply: "#dcfce7",
    "supply chain": "#dcfce7",
    default: "#f4f4f5",
  };

  const domainsMap = new Map<
    string,
    {
      domain: GraphDomain;
    }
  >();

  for (const node of data.nodes) {
    const domainKey = (node.domain ?? node.data?.domain ?? node.metadata?.domain ?? "unassigned").toLowerCase();
    const title = node.domain ?? node.data?.domain ?? node.metadata?.domain ?? "Unassigned";
    if (!domainsMap.has(domainKey)) {
      const fallback = domainFallbacks[domainKey];
      domainsMap.set(domainKey, {
        domain: {
          id: domainKey,
          title,
          color: domainPalette[domainKey] ?? fallback?.color ?? domainPalette.default,
          regions: fallback?.regions?.length ? [...fallback.regions] : ["NA", "EMEA", "APAC"],
          systems: [],
          aleTags: [],
        },
      });
    }

    const system = {
      id: node.id,
      title: node.label ?? node.name ?? node.id,
      impact: Number(node.impact ?? node.data?.impact ?? 0.5),
      stage: (node.stage ?? node.data?.stage ?? "current").toLowerCase(),
      phase: (node.phase ?? node.data?.phase ?? "fy26").toLowerCase(),
      vendors: node.vendors ?? node.data?.vendors ?? [],
      aleTags: node.aleTags ?? node.data?.aleTags ?? [],
    } satisfies GraphSystem;

    domainsMap.get(domainKey)!.domain.systems.push(system);
  }

  if (!domainsMap.size) return null;

  return {
    timeline: dataset.timeline,
    domains: Array.from(domainsMap.values()).map((entry) => entry.domain),
  };
}

export default function GraphPrototypePage() {
  const [graphDataset, setGraphDataset] = useState<GraphDataset>(dataset);
  const timelineBands = graphDataset.timeline;
  const [focus, setFocus] = useState("domain");
  const [mode, setMode] = useState("systems");
  const [stage, setStage] = useState("orientation");
  const [showStoreOverlay, setShowStoreOverlay] = useState(true);
  const [activePhase, setActivePhase] = useState(timelineBands[0]?.id ?? "fy26");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2800);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const [sequence, setSequence] = useState<SequencerItem[]>(sequencerData);
  const [dragId, setDragId] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [intentCommand, setIntentCommand] = useState("");
  const [intentConfirmation, setIntentConfirmation] = useState<string | null>(null);
  const [highlightedRegionKey, setHighlightedRegionKey] = useState<string | null>(null);
  const [highlightedSystemIds, setHighlightedSystemIds] = useState<Set<string> | null>(null);
  const handleIntentConfirmationDisplay = useCallback((message: string, context: IntentConfirmationContext) => {
    setIntentConfirmation(message);
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} · ${message}`, ...prev].slice(0, 6));
    if (context?.mutation?.targetRegion) {
      setHighlightedRegionKey(context.mutation.targetRegion.toLowerCase());
    }
    const systems = context?.mutation?.updates?.systems;
    if (systems?.length) {
      setHighlightedSystemIds(new Set(systems));
    }
  }, []);
  const { submitIntent, status: intentStatus, error: intentError, confirmation: lastIntentResult } = useSequencerBridge({
    sequence,
    setSequence,
    onConfirmation: handleIntentConfirmationDisplay,
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [aleTags, setAleTags] = useState<string[]>([]);
  const [integrationFlows, setIntegrationFlows] = useState<IntegrationFlow[]>([]);
  const [integrationLoading, setIntegrationLoading] = useState(true);
  const [integrationError, setIntegrationError] = useState<string | null>(null);
  const { summary: storeSummary } = useStoreData();
  const { nodes: decisionNodes } = useDecisionBacklog();
  const { lensId, activeLens, lensOptions, setLens } = useTransformationLens();
  const [activeTransitionPath, setActiveTransitionPath] = useState<string | null>(null);
  const sequenceItemRefs = useRef<Map<string, HTMLLIElement | null>>(new Map());

  const integrationStats = useMemo(() => applyIntegrationStats(graphDataset.domains, integrationFlows), [graphDataset, integrationFlows]);
  const domains = integrationStats.domains;
  const unmatchedIntegrationFlows = integrationStats.unmatched;
  const totalIntegrationFlows = integrationFlows.length;
  const matchedIntegrationFlows = totalIntegrationFlows - unmatchedIntegrationFlows.length;

  const systemDomainMap = useMemo(() => {
    const map = new Map<string, string>();
    domains.forEach((domain) => {
      domain.systems.forEach((system) => {
        map.set(system.id, domain.id);
      });
    });
    return map;
  }, [domains]);

  const lensFilters = useMemo(() => {
    const toKey = (value?: string) => (value ?? "").toLowerCase().replace(/[\s_]+/g, " ").trim();
    const domainSet = new Set((activeLens.domains ?? []).map(toKey).filter(Boolean));
    const systemSet = new Set((activeLens.systems ?? []).map(toKey).filter(Boolean));
    const phaseSet = new Set((activeLens.phases ?? []).map(toKey).filter(Boolean));
    const regionSet = new Set((activeLens.regions ?? []).map(toKey).filter(Boolean));
    const hasFilters = domainSet.size > 0 || systemSet.size > 0 || phaseSet.size > 0 || regionSet.size > 0;

    const domainMatches = (domain: GraphDomain | string | undefined) => {
      if (!domainSet.size) return true;
      if (!domain) return false;
      const id = typeof domain === "string" ? domain : domain.id;
      const title = typeof domain === "string" ? domain : domain.title;
      const candidates = [toKey(id), toKey(title)];
      return candidates.some((candidate) => domainSet.has(candidate));
    };

    const systemMatches = (system: GraphSystem, domain: GraphDomain) => {
      if (!hasFilters) return true;
      if (domainSet.size && !domainMatches(domain)) return false;
      if (systemSet.size) {
        const candidates = [toKey(system.id), toKey(system.title)];
        if (!candidates.some((candidate) => systemSet.has(candidate))) return false;
      }
      if (phaseSet.size && !phaseSet.has(toKey(system.phase))) return false;
      return true;
    };

    const sequenceMatches = (item: SequencerItem) => {
      if (!hasFilters) return true;
      if (phaseSet.size && !phaseSet.has(toKey(item.phase))) return false;
      if (regionSet.size && !regionSet.has(toKey(item.region))) return false;
      if (systemSet.size && item.system && !systemSet.has(toKey(item.system))) return false;
      if (domainSet.size && item.system) {
        const domainId = systemDomainMap.get(item.system);
        if (!domainId || !domainSet.has(toKey(domainId))) return false;
      }
      return true;
    };

    const decisionMatches = (node: DecisionNode) => {
      if (!hasFilters) return true;
      if (regionSet.size && !node.region.some((region) => regionSet.has(toKey(region)))) return false;
      if (phaseSet.size && !phaseSet.has(toKey(node.timeline))) return false;
      return true;
    };

    return {
      id: activeLens.id,
      label: activeLens.label,
      description: activeLens.description,
      hasFilters,
      shouldMuteDomain: (domain: GraphDomain) => hasFilters && !domainMatches(domain),
      shouldMuteSystem: (system: GraphSystem, domain: GraphDomain) => hasFilters && !systemMatches(system, domain),
      matchesSequenceItem: sequenceMatches,
      matchesDecisionNode: decisionMatches,
    };
  }, [activeLens, systemDomainMap, domains]);

  const stageMeta = useMemo(() => revealStages.find((s) => s.id === stage) ?? revealStages[0], [stage]);
  const phaseOrder = useMemo(() => timelineBands.map((band) => band.id), [timelineBands]);

  const aggregatedPhaseMetrics: PhaseInsight[] = useMemo(() => {
    return timelineBands.map((band) => {
      const systems = domains.flatMap((domain) =>
        domain.systems.filter((system) => system.phase === band.id && !(lensFilters.shouldMuteSystem(system, domain) ?? false)),
      );
      const totals = systems.reduce(
        (acc, system) => {
          const metrics = roiData[system.id];
          if (!metrics) return acc;
          acc.count += 1;
          acc.roi += metrics.roi;
          acc.tcc += metrics.tcc;
          acc.risk += metrics.risk ?? 0;
          return acc;
        },
        { count: 0, roi: 0, tcc: 0, risk: 0 },
      );
      return {
        phase: band.id,
        label: band.label,
        roi: totals.count ? totals.roi / totals.count : 0,
        tcc: totals.tcc,
        risk: totals.count ? totals.risk / totals.count : 0,
      };
    });
  }, [timelineBands, domains, lensFilters]);

  const predictiveScenarios = usePredictiveScenarios(aggregatedPhaseMetrics, activePhase);
  const activeScenario = useMemo(
    () => predictiveScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [predictiveScenarios, selectedScenarioId],
  );
  const financialPhases = useMemo(() => roiSummary.phases ?? [], []);
  const transitionPaths = useMemo(() => roiSummary.paths ?? [], []);

  const regionToSequenceId = useMemo(() => {
    const map = new Map<string, string>();
    sequence.forEach((item) => {
      const key = item.region.toLowerCase();
      if (!map.has(key)) {
        map.set(key, item.id);
      }
    });
    return map;
  }, [sequence]);

  const sequenceForRender = useMemo(() => {
    if (!lensFilters.hasFilters) return sequence;
    const subset = sequence.filter((item) => lensFilters.matchesSequenceItem(item));
    return subset.length ? subset : sequence;
  }, [sequence, lensFilters]);

  const highlightedSequenceId = useMemo(() => {
    if (!highlightedRegionKey) return null;
    return regionToSequenceId.get(highlightedRegionKey) ?? null;
  }, [highlightedRegionKey, regionToSequenceId]);

  const decisionNodesForRender = useMemo(() => {
    if (!lensFilters.hasFilters) return decisionNodes;
    const subset = decisionNodes.filter((node) => lensFilters.matchesDecisionNode(node));
    return subset.length ? subset : decisionNodes;
  }, [decisionNodes, lensFilters]);

  const focusOption = useMemo(() => guidedFocusOptions.find((option) => option.id === focus) ?? guidedFocusOptions[0], [focus]);

  useEffect(() => {
    if (!highlightedSequenceId) return;
    const element = sequenceItemRefs.current.get(highlightedSequenceId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(() => setHighlightedRegionKey(null), 5000);
    return () => clearTimeout(timer);
  }, [highlightedSequenceId]);

  useEffect(() => {
    if (!highlightedSystemIds || highlightedSystemIds.size === 0) return;
    const timer = setTimeout(() => setHighlightedSystemIds(null), 5000);
    return () => clearTimeout(timer);
  }, [highlightedSystemIds]);

  const logLearningEvent = useCallback((code: string, details?: Record<string, unknown>) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} · ${code}`, ...prev].slice(0, 6));
    void fetch("/api/ale/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, details }),
    }).catch(() => null);
  }, []);

  useEffect(() => {
    if (!lastIntentResult) return;
    const { context } = lastIntentResult;
    logLearningEvent("LE_INTENT_APPLIED", {
      command: context.command,
      region: context.event.payload.region,
      phase: context.event.payload.phase,
      action: context.event.payload.action ?? "update",
      channels: context.event.payload.channels,
      target: context.event.payload.target,
    });
    emitTelemetry("intent_sequence_applied", {
      workspace_id: "prototype",
      region: context.event.payload.region,
      phase: context.event.payload.phase,
      action: context.event.payload.action ?? "update",
      channels: context.event.payload.channels,
      target: context.event.payload.target,
    });
  }, [lastIntentResult, logLearningEvent, emitTelemetry]);

  useEffect(() => {
    if (!lensId) return;
    logLearningEvent("LE_LENS_CHANGED", { lens: lensId });
  }, [lensId, logLearningEvent]);

  const handleFocusChange = (next: string) => {
    setFocus(next);
    emitTelemetry("graph_focus_changed", { focus: next, workspace_id: "prototype" });
    logLearningEvent("LE-003", { focus: next });
  };

  const handleModeChange = (next: string) => {
    setMode(next);
    emitTelemetry("graph_mode_changed", { mode: next, workspace_id: "prototype" });
    logLearningEvent("LE-005", { mode: next });
  };

  const handleStageChange = (next: string) => {
    setStage(next);
    emitTelemetry("graph_stage_revealed", { stage: next, workspace_id: "prototype" });
    logLearningEvent("LE-002", { stage: next });
  };

  const handlePhaseChange = useCallback(
    (phase: string) => {
      setActivePhase(phase);
      logLearningEvent("LE-001", { phase });
    },
    [logLearningEvent],
  );

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
    playbackTimer.current = setInterval(stepPhaseForward, playbackSpeed);
    return () => {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
    };
  }, [isPlaying, playbackSpeed, stepPhaseForward]);

  useEffect(() => {
    let cancelled = false;
    const runMonitor = async () => {
      try {
        const backupOk = await verifyLatestBackup();
        if (!backupOk) {
          console.warn("⚠️ dx: Proceeding without confirmed backup.");
        }

        const response = await fetch("/api/digital-enterprise/view?project=dx-monitor&mode=all", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!response.ok) {
          console.warn(`⚠️ dx: Graph API error ${response.status}`);
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          monitorGraphData({ ...data, source: "api" });
          const derived = buildGraphDatasetFromApi(data);
          if (derived) {
            setGraphDataset(derived);
            if (!derived.domains.some((domain) => domain.systems.some((system) => system.phase === activePhase))) {
              setActivePhase(derived.timeline[0]?.id ?? "fy26");
            }
          }
        }
      } catch (error) {
        if (!cancelled) console.warn("⚠️ dx: Failed to monitor graph data", error);
      }
    };
    void runMonitor();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshIntegrationFlows = useCallback(async () => {
    setIntegrationLoading(true);
    setIntegrationError(null);
    try {
      const response = await fetch("/api/ale/integration-flows?source=datadog", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Failed to load integration flows (${response.status})`);
      const json = await response.json();
      setIntegrationFlows(Array.isArray(json.flows) ? json.flows : []);
    } catch (error: any) {
      setIntegrationError(error?.message ?? "Unable to load integration flows");
      setIntegrationFlows([]);
    } finally {
      setIntegrationLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIntegrationFlows();
  }, [refreshIntegrationFlows]);

  const handlePlaybackToggle = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      logLearningEvent(next ? "LE-006" : "LE-007", { playing: next });
      return next;
    });
  };

  const handleIntentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const command = intentCommand.trim();
    if (!command) return;
    setIntentConfirmation(null);
    const handled = await submitIntent(command);
    if (handled) {
      setIntentCommand("");
    }
  };

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
    logLearningEvent("LE-008", { from: currentIndex, to: targetIndex, item: moved.id });
  };
  const handleDragEnd = () => setDragId(null);

  const handleScenarioSelect = (scenario: PredictiveScenario) => {
    setSelectedScenarioId(scenario.id);
    logLearningEvent("LE-009", { scenario: scenario.id, phase: scenario.phase });
  };

  const handleScenarioActivate = (scenario: PredictiveScenario) => {
    handlePhaseChange(scenario.phase);
    logLearningEvent("LE-010", {
      scenario: scenario.id,
      roiDelta: scenario.roiDelta,
      tccDelta: scenario.tccDelta,
      timelineDelta: scenario.timelineDeltaMonths,
    });
  };

  const handleTransitionPathSelect = (path: TransitionPath) => {
    setActiveTransitionPath(path.id);
    logLearningEvent("LE_PATH_SELECTED", { path: path.id, roi: path.roi, tcc: path.tcc });
  };

  const handleSelectNode = (node: SelectedNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setAleTags([]);
      return;
    }
    const domainKey = node.domain.id.toLowerCase();
    setAleTags(DOMAIN_TAGS[domainKey] ?? DOMAIN_TAGS.default);
    logLearningEvent("LE-011", { node: node.kind === "system" ? node.system.id : node.domain.id });
  };

  const eAgentMessage = useMemo(() => {
    const band = timelineBands.find((item) => item.id === activePhase);
    const phaseCopy = band ? `Focusing on ${band.label}.` : "";
    if (focus === "domain") return `Highlighting key OMS, MFCS, and EBS domains. ${phaseCopy}`;
    if (focus === "goal") return `Tracking value themes across modernization goals. ${phaseCopy}`;
    return `Sequencing the modernization stages. ${phaseCopy}`;
  }, [focus, activePhase]);

  const inspectorName = useMemo(() => {
    if (!selectedNode) return null;
    return selectedNode.kind === "system" ? selectedNode.system.title : selectedNode.domain.title;
  }, [selectedNode]);
  const inspectorDomain = useMemo(() => {
    if (!selectedNode) return null;
    return selectedNode.domain.title;
  }, [selectedNode]);

  return (
    <UXShellLayout sidebarHidden sidebar={null}>
      <div className="min-h-screen bg-[#1E1E2E] py-12 font-[var(--font-shadcn)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 text-neutral-200">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-neutral-400">Prototype</p>
            <h1 className="text-3xl font-semibold text-white">Enterprise OMS Transformation Graph</h1>
            <p className="text-sm text-neutral-300">FY26–FY28 sequencing, ALE overlays, and EAgent guidance.</p>
          </header>

          <section className="grid gap-3 lg:grid-cols-4">
            <ControlPanel title="Guided Focus">
              {guidedFocusOptions.map((option) => (
                <ControlButton
                  key={option.id}
                  active={focus === option.id}
                  label={option.label}
                  helper={option.helper}
                  onClick={() => handleFocusChange(option.id)}
                />
              ))}
            </ControlPanel>

            <ControlPanel title="View Mode">
              {viewModes.map((vm) => (
                <ControlButton
                  key={vm.id}
                  active={mode === vm.id}
                  label={vm.label}
                  helper={vm.helper}
                  onClick={() => handleModeChange(vm.id)}
                />
              ))}
            </ControlPanel>

            <ControlPanel title="Reveal States">
              {revealStages.map((rs) => (
                <ControlButton
                  key={rs.id}
                  active={stage === rs.id}
                  label={`${rs.label} · ${rs.tone}`}
                  helper={rs.summary}
                  onClick={() => handleStageChange(rs.id)}
                />
              ))}
            </ControlPanel>
            <ControlPanel title="Transformation Lens">
              {lensOptions.map((lens) => (
                <ControlButton
                  key={lens.id}
                  active={lensId === lens.id}
                  label={lens.label}
                  helper={lens.description}
                  onClick={() => setLens(lens.id)}
                />
              ))}
            </ControlPanel>
          </section>

          <GraphSimulationControls
            isPlaying={isPlaying}
            onToggle={handlePlaybackToggle}
            onStep={stepPhaseForward}
            speed={playbackSpeed}
            onSpeedChange={(speed) => setPlaybackSpeed(speed)}
            phases={timelineBands}
            activePhase={activePhase}
            onScrub={(phaseId) => handlePhaseChange(phaseId)}
            extra={
              activeScenario ? (
                <p className="text-[0.7rem] text-neutral-600">
                  Active scenario · <span className="font-semibold text-neutral-900">{activeScenario.title}</span> — ROI {(activeScenario.roiDelta * 100).toFixed(1)}% ·
                  {activeScenario.timelineDeltaMonths >= 0 ? " +" : " "}
                  {activeScenario.timelineDeltaMonths} mo
                </p>
              ) : null
            }
            storeOverlayEnabled={showStoreOverlay}
            onStoreOverlayToggle={(value) => {
              setShowStoreOverlay(value);
              logLearningEvent("LE-012", { storeOverlay: value });
            }}
          />
          <PhaseInsightStrip insights={aggregatedPhaseMetrics} activePhase={activePhase} onSelect={(phase) => handlePhaseChange(phase)} />
          <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 text-neutral-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Intent Bridge</p>
            <p className="text-sm text-neutral-600">Send a quick `/intent` command to reshape the sequencer.</p>
            <form className="mt-3 flex flex-col gap-2 md:flex-row" onSubmit={handleIntentSubmit}>
              <input
                type="text"
                value={intentCommand}
                onChange={(event) => setIntentCommand(event.target.value)}
                placeholder="/intent start Canada with B2B+B2C decouple EBS"
                className="flex-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={intentStatus === "working"}
                className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {intentStatus === "working" ? "Processing…" : "Send Intent"}
              </button>
            </form>
            {intentError ? (
              <p className="mt-2 text-xs text-rose-600">{intentError}</p>
            ) : intentConfirmation ? (
              <p className="mt-2 text-xs text-emerald-600">{intentConfirmation}</p>
            ) : null}
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <GraphCanvas
              focus={focus}
              focusHelper={focusOption.helper}
              mode={mode}
              stage={stage}
              stageMeta={stageMeta}
              eAgentMessage={eAgentMessage}
              domains={domains}
              timeline={timelineBands}
              activePhase={activePhase}
              showStoreOverlay={showStoreOverlay}
              storeSummary={storeSummary}
              onSelectNode={handleSelectNode}
              roiData={roiData}
              sequence={sequenceForRender}
              highlightNodeIds={highlightedSystemIds}
              highlightedPhaseMetrics={aggregatedPhaseMetrics.find((metric) => metric.phase === activePhase)}
              scenarioPhase={activeScenario?.phase ?? null}
              lensFilters={lensFilters}
            />
            <div className="space-y-4">
              <GraphSequencerPanel
                sequence={sequenceForRender}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                activePhase={activePhase}
                onSimulate={(phase) => handlePhaseChange(phase)}
                onTogglePlayback={handlePlaybackToggle}
                isPlaying={isPlaying}
                highlightSequenceId={highlightedSequenceId}
                onItemMount={(id, el) => {
                  if (el) {
                    sequenceItemRefs.current.set(id, el);
                  } else {
                    sequenceItemRefs.current.delete(id);
                  }
                }}
              />
              <GraphPredictivePanel
                scenarios={predictiveScenarios}
                selectedScenarioId={selectedScenarioId}
                onSelect={(scenario) => handleScenarioSelect(scenario)}
                onActivate={(scenario) => handleScenarioActivate(scenario)}
              />
              <GraphFinancialSummary phases={financialPhases} activePhase={activePhase} />
              <GraphTransitionCompare
                paths={transitionPaths}
                activePathId={activeTransitionPath}
                onSelect={handleTransitionPathSelect}
              />
              <DecisionBacklogPanel
                nodes={decisionNodesForRender}
                onSelect={(node) => {
                  setEventLog((prev) => [`${new Date().toLocaleTimeString()} · Decision: ${node.title}`, ...prev].slice(0, 6));
                  logLearningEvent("LE_DECISION_SELECTED", { node: node.id, timeline: node.timeline });
                }}
              />
              <NodeInspector
                nodeName={inspectorName}
                domain={inspectorDomain}
                tags={aleTags}
                integrations={selectedNode?.kind === "system" ? selectedNode.system.integrationFlows ?? [] : []}
              />
              <IntegrationTelemetryPanel
                flows={integrationFlows}
                matchedCount={matchedIntegrationFlows}
                unmatchedCount={unmatchedIntegrationFlows.length}
                loading={integrationLoading}
                error={integrationError}
                onRefresh={refreshIntegrationFlows}
              />
              <GraphEventConsole events={eventLog} />
            </div>
          </div>
        </div>
      </div>
    </UXShellLayout>
  );
}

function ControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-3 text-neutral-800 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function ControlButton({ active, label, helper, onClick }: { active: boolean; label: string; helper: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-2xl border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-200",
        active ? "border-indigo-600 bg-indigo-600 text-white" : "border-neutral-200 bg-white text-neutral-800",
      )}
    >
      <p className="font-semibold">{label}</p>
      <p className={clsx("text-xs", active ? "text-white/80" : "text-neutral-500")}>{helper}</p>
    </button>
  );
}

function IntegrationTelemetryPanel({
  flows,
  matchedCount,
  unmatchedCount,
  loading,
  error,
  onRefresh,
}: {
  flows: IntegrationFlow[];
  matchedCount: number;
  unmatchedCount: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  const recent = useMemo(() => {
    return flows
      .slice()
      .sort((a, b) => {
        const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [flows]);

  const formatLatency = (value?: number) => {
    if (typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)) {
      return `${Math.round(value)} ms`;
    }
    return "—";
  };

  const formatErrorRate = (value?: number) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${(value * 100).toFixed(1)}%`;
    }
    return "—";
  };

  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 text-neutral-800 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Integration telemetry</p>
          <p className="text-xl font-semibold text-neutral-900">{matchedCount} mapped / {flows.length} total</p>
          {unmatchedCount ? <p className="text-xs text-neutral-500">{unmatchedCount} flows could not be matched to OMS nodes.</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onRefresh().catch(() => null)}
          className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 hover:border-neutral-500 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      {!flows.length && !loading ? <p className="mt-2 text-xs text-neutral-500">No telemetry ingested yet.</p> : null}
      {recent.length ? (
        <div className="mt-3 overflow-auto rounded-2xl border border-neutral-200">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead>
              <tr className="text-[0.6rem] uppercase tracking-[0.35em] text-neutral-500">
                <th className="px-3 py-2">Flow</th>
                <th className="px-3 py-2">Env</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Errors</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((flow) => (
                <tr key={flow.flow_id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 font-semibold text-neutral-900">
                    {flow.system_from} → {flow.system_to}
                  </td>
                  <td className="px-3 py-2">{flow.env ?? "prod"}</td>
                  <td className="px-3 py-2 capitalize">{flow.status ?? "unknown"}</td>
                  <td className="px-3 py-2">{formatLatency(flow.latency_ms)}</td>
                  <td className="px-3 py-2">{formatErrorRate(flow.error_rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function GraphCanvas({
  focus,
  focusHelper,
  mode,
  stage,
  stageMeta,
  eAgentMessage,
  domains,
  timeline,
  activePhase,
  showStoreOverlay,
  storeSummary,
  onSelectNode,
  roiData,
  sequence,
  scenarioPhase,
  highlightedPhaseMetrics,
  lensFilters,
}: {
  focus: string;
  focusHelper: string;
  mode: string;
  stage: string;
  stageMeta: (typeof revealStages)[number];
  eAgentMessage: string;
  domains: GraphDomain[];
  timeline: TimelineBand[];
  activePhase: string;
  showStoreOverlay: boolean;
  storeSummary: Record<string, { total: number; brands?: Record<string, number> }>;
  onSelectNode: (node: SelectedNode | null) => void;
  roiData: Record<string, { roi: number; tcc: number; risk: number }>;
  sequence: SequencerItem[];
  scenarioPhase?: string | null;
  highlightedPhaseMetrics?: { phase: string; label: string; roi: number; tcc: number; risk: number };
  lensFilters?: GraphLensFilters;
}) {
  const showEdges = stage === "connectivity" || stage === "insight";
  const showNodes = stage !== "orientation";
  const showOverlays = stage === "insight";
  const sequenceLookup = useMemo(() => new Map(sequence.map((item, index) => [item.system ?? item.id, { item, order: index }])), [sequence]);
  const orderedDomains = useMemo(() => {
    if (!lensFilters?.hasFilters) return domains;
    return domains
      .slice()
      .sort((a, b) => Number(lensFilters.shouldMuteDomain(a)) - Number(lensFilters.shouldMuteDomain(b)));
  }, [domains, lensFilters]);

  return (
    <section className="relative rounded-[32px] border border-neutral-200 bg-neutral-50/95 p-6 text-neutral-900 shadow-xl">
      <TimelineBands bands={timeline} activePhase={activePhase} />
      {lensFilters?.hasFilters ? (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white/90 px-3 py-2 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-900">{lensFilters.label}</span>
          <span>{lensFilters.description}</span>
        </div>
      ) : null}
      <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
        {orderedDomains.map((domain) => {
          const domainIntegrationCount = domain.systems.reduce((sum, system) => sum + (system.integrationCount ?? 0), 0);
          const topIntegrationSystems = domain.systems
            .filter((system) => (system.integrationCount ?? 0) > 0)
            .sort((a, b) => (b.integrationCount ?? 0) - (a.integrationCount ?? 0))
            .slice(0, 2);
          return (
          <div
            key={domain.id}
            className={clsx(
              "group cursor-pointer rounded-[32px] border border-neutral-200 bg-white p-4 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.8)] transition",
              lensFilters?.shouldMuteDomain(domain) ? "opacity-30" : "opacity-100",
            )}
            onClick={() => onSelectNode({ kind: "domain", domain })}
          >
            {(() => {
              return null;
            })()}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">{domain.title}</p>
                {focus === "stage" ? <p className="text-xs text-neutral-500">Stage ribbon</p> : null}
              </div>
            </div>
            {showStoreOverlay ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {domain.regions.map((region) => (
                  <div
                    key={`${domain.id}-${region}`}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[0.6rem]"
                  >
                    <span className="font-semibold uppercase tracking-[0.35em] text-neutral-700">{region}</span>
                    <span className="text-neutral-500">· {(storeSummary[region]?.total ?? 0).toLocaleString()} stores</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className={clsx("mt-4 space-y-3", showNodes ? "opacity-100" : "opacity-100")} aria-label={`${domain.title} systems`}>
              {(lensFilters?.hasFilters
                ? domain.systems
                    .slice()
                    .sort(
                      (a, b) =>
                        Number(lensFilters.shouldMuteSystem(a, domain)) - Number(lensFilters.shouldMuteSystem(b, domain)),
                    )
                : domain.systems
              ).map((system) => {
                const sequenceInfo = sequenceLookup.get(system.id);
                const isActivePhase = system.phase === activePhase;
                const isScenarioPhase = scenarioPhase && scenarioPhase === system.phase;
                const systemMuted = lensFilters?.shouldMuteSystem(system, domain) ?? false;
                return (
                  <button
                    key={system.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectNode({ kind: "system", domain, system });
                    }}
                    className={clsx(
                      "w-full rounded-2xl border px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300/50",
                      isActivePhase
                        ? "border-emerald-500 bg-white"
                        : isScenarioPhase
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-neutral-200 bg-white",
                      systemMuted ? "opacity-40" : "opacity-100",
                      showEdges ? "hover:border-neutral-400" : undefined,
                    )}
                  >
                    <p className="font-semibold text-neutral-950">{system.title}</p>
                    <p className="text-xs text-neutral-600">Impact {(system.impact * 100).toFixed(0)}%</p>
                    {system.vendors?.length ? (
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-neutral-500">{system.vendors.join(", ")}</p>
                    ) : null}
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-neutral-500">
                      {system.stage} · {system.phase.toUpperCase()}
                    </p>
                    {mode === "roi" && roiData[system.id] ? (
                      <div className="mt-2 text-xs text-neutral-600">
                        ROI {(roiData[system.id].roi * 100).toFixed(0)}% · TCC ${roiData[system.id].tcc.toFixed(1)}M
                        <span className={clsx("ml-2 text-[0.65rem] font-semibold", riskState(roiData[system.id].risk).className)}>
                          {riskState(roiData[system.id].risk).label} risk
                        </span>
                      </div>
                    ) : null}
                    {mode === "sequencer" && sequenceInfo ? (
                      <div className="mt-2 space-y-1 text-xs text-neutral-600">
                        <p>
                          Sequence #{sequenceInfo.order + 1} · {sequenceInfo.item.phase.toUpperCase()} · {sequenceInfo.item.region}
                        </p>
                        {sequenceInfo.item.dependencies?.length ? (
                          <div className="flex flex-wrap gap-1 text-[0.6rem] text-neutral-500">
                            {sequenceInfo.item.dependencies.map((dep) => (
                              <span key={`${system.id}-${dep}`} className="rounded-full border border-neutral-200 px-2 py-0.5">
                                depends on {dep}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {system.integrationFlows?.length ? (
                      <div className="mt-2 space-y-1 text-[0.6rem] text-neutral-500">
                        <p className="font-semibold uppercase tracking-[0.3em] text-neutral-500">
                          Integrations · {system.integrationCount ?? system.integrationFlows.length}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {system.integrationFlows.slice(0, 2).map((flow) => {
                            const counterpart = flow.direction === "source" ? flow.system_to : flow.system_from;
                            const arrow = flow.direction === "source" ? "→" : "←";
                            return (
                              <span key={`${system.id}-${flow.flow_id}-${flow.direction}`} className="rounded-full border border-neutral-200 px-2 py-0.5">
                                {arrow} {counterpart}
                              </span>
                            );
                          })}
                          {system.integrationFlows.length > 2 ? (
                            <span className="text-[0.6rem] text-neutral-400">+{system.integrationFlows.length - 2} more</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {showEdges ? (
              <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-sm">
                <p className="font-semibold text-neutral-900 uppercase tracking-[0.2em] text-[0.6rem]">Integration telemetry</p>
                {domainIntegrationCount ? (
                  <>
                    <p className="mt-1 text-sm text-neutral-600">
                      Monitoring {domainIntegrationCount} {domainIntegrationCount === 1 ? "flow" : "flows"} (Datadog)
                    </p>
                    <ul className="mt-2 space-y-1 text-[0.65rem] text-neutral-500">
                      {topIntegrationSystems.map((system) => (
                        <li key={`${domain.id}-${system.id}-summary`}>
                          <span className="font-semibold text-neutral-800">{system.title}</span> · {system.integrationCount} flows
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-neutral-500">No monitored flows for this domain.</p>
                )}
              </div>
            ) : null}
          </div>
          );
        })}
      </div>

      {showOverlays ? (
        <div className="mt-4 rounded-2xl border border-rose-100 bg-white/85 px-4 py-3 text-sm text-rose-700 shadow">
          <p className="font-semibold">ROI Overlay</p>
          <p className="text-xs">High impact zones glowing · ready for sequencer playback.</p>
        </div>
      ) : null}
    </section>
  );
}

function TimelineBands({ bands, activePhase }: { bands: TimelineBand[]; activePhase: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex gap-2">
      {bands.map((band) => (
        <div
          key={band.id}
          className={clsx(
            "flex-1 rounded-[28px] border border-dashed border-neutral-200/70 px-3 py-4",
            band.id === activePhase ? "bg-emerald-50/80" : "bg-transparent",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">{band.label}</p>
        </div>
      ))}
    </div>
  );
}
