"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Stage } from "@/components/layout/Stage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { GraphSequencerPanel, GraphEventConsole, type GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { useTelemetry } from "@/hooks/useTelemetry";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import type { AleContext } from "@/lib/ale/contextStore";
import type { LivingMapData } from "@/types/livingMap";
import { useSequencerBridge } from "@/hooks/useSequencerBridge";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { useStoreData } from "@/hooks/useStoreData";
import sequenceIndex from "@/data/sequences/index.json";
import {
  buildCollisionContext,
  formatFiscalMonth,
  getSeverityLabel,
  highestSeverity,
  type Collision,
  type CollisionReport,
  type CollisionSeverity,
  type CollisionRule,
  type StageWithTimeline,
} from "@/lib/sequencer/collisions";
import { buildStageAwareness } from "@/lib/sequencer/awareness";
import { buildSequenceDraft } from "@/lib/sequencer/draftBuilder";
import type {
  DecisionLogEntry,
  RoleReviewFinding,
  RoleReviewMode,
  RoleReviewRun,
  StageAwareness,
} from "@/lib/sequencer/types";

const SEQUENCE_REGISTRY = sequenceIndex as SequenceRegistryEntry[];

type ViewSettings = {
  showReadiness: boolean;
  showRoadmapOverlay: boolean;
  showStoreCoverage: boolean;
  showConflictBadges: boolean;
  showArchitectureComponents: boolean;
};

type StageFilters = {
  conflictsOnly: boolean;
  storeImpactOnly: boolean;
  readiness: "all" | "under60" | "under80";
};

type RolePreset = "overview" | "architect" | "operator";

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  showReadiness: false,
  showRoadmapOverlay: false,
  showStoreCoverage: false,
  showConflictBadges: true,
  showArchitectureComponents: true,
};
const DEFAULT_STAGE_FILTERS: StageFilters = {
  conflictsOnly: false,
  storeImpactOnly: false,
  readiness: "all",
};
const VIEW_SETTINGS_STORAGE_KEY = "sequencer_view_settings_v1";
const VIEW_TOGGLE_OPTIONS: Array<{ key: keyof ViewSettings; label: string; helper: string }> = [
  { key: "showReadiness", label: "Stage readiness", helper: "Highlights readiness % on each card" },
  { key: "showRoadmapOverlay", label: "Lane overlay", helper: "Reveals readiness/risk summary blocks" },
  { key: "showStoreCoverage", label: "Store impact", helper: "Shows impacted stores + footprint" },
  { key: "showConflictBadges", label: "Conflict badges", helper: "Toggle conflict chips on cards" },
  { key: "showArchitectureComponents", label: "Architecture detail", helper: "Show systems + integration lists per FY lane" },
];
const READINESS_FILTER_OPTIONS: Array<{ value: StageFilters["readiness"]; label: string }> = [
  { value: "all", label: "All readiness" },
  { value: "under80", label: "< 80% readiness" },
  { value: "under60", label: "< 60% readiness" },
];
const ROLE_PRESETS: Array<{ id: RolePreset; label: string; description: string }> = [
  { id: "architect", label: "Architect", description: "Timeline-first, hide rails." },
  { id: "overview", label: "Overview", description: "Show scenarios and operator tools." },
  { id: "operator", label: "CFO", description: "Operator tools only." },
];
const ROLE_REVIEW_MODE_BY_PRESET: Record<RolePreset, RoleReviewMode> = {
  architect: "Architect",
  overview: "Readiness",
  operator: "CFO",
};
const WAVE_COLOR_CLASSES = ["bg-sky-100 text-sky-800", "bg-emerald-100 text-emerald-800", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-800"];
const WAVE_PRESSURE_MEDIUM_THRESHOLD = 40;
const WAVE_PRESSURE_HIGH_THRESHOLD = 70;
const WAVE_PRESSURE_MAX = 100;
const CHANGE_KEYWORDS = ["decouple", "retire", "sunset", "replace", "decommission", "cutover"];
const DUAL_RUN_KEYWORDS = ["dual-run", "dual run", "parallel run", "bridge run", "dual operations"];
const COLLISION_RULE_LABELS: Record<CollisionRule, string> = {
  sharedIntegrationOverlap: "Shared integration in parallel window",
  sharedCriticalSystemOverlap: "Critical system touched in both waves",
  sharedSystemOverlap: "Same system touched in overlap",
  sharedDomainOverlap: "Same domain competing for change window",
};

const CLAMP_TWO_LINES: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const CLAMP_THREE_LINES: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
};

type ScenarioBrief = {
  name: string;
  scope_region: string;
  scope_brand: string;
  scope_channels: string;
  scope_storeCount?: number;
  goal: string;
  primaryRisk: string;
  decisionNeeded: string;
  owner: string;
};

type ConflictSummaryData = {
  total: number;
  high: number;
  medium: number;
  low: number;
  topStage?: StageWithTimeline;
  topStageCount: number;
  topStagePartner?: StageWithTimeline;
  topStageRules?: CollisionRule[];
  topStageOverlap?: { fyStart: string; fyEnd: string };
  topStageSeverity?: CollisionSeverity;
};

type WavePressurePartner = {
  waveId: string;
  label: string;
  score: number;
  sharedSystems: string[];
  sharedIntegrations: string[];
  sharedDomains: string[];
  highestSeverity?: CollisionSeverity;
  overlapWindows: string[];
};

type WavePressureEntry = {
  waveId: string;
  label: string;
  score: number;
  partners: WavePressurePartner[];
};

type WavePressureMatrix = Map<string, WavePressureEntry>;

type SharedChangeFocus = {
  waveId: string;
  systems: Set<string>;
  integrations: Set<string>;
  affectedWaveKeys: Set<string>;
};

const SCENARIO_BRIEFS: Record<string, ScenarioBrief> = {
  "scenario-order-management": {
    name: "Order Management — Canada (Teva)",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    scope_storeCount: 34,
    goal: "Prove Canada rollout works while decoupling EBS from B2C order flow.",
    primaryRisk: "Split-brain order ownership + ATP/ATS contract drift during dual-run.",
    decisionNeeded: "MFCS-first vs direct integration (EBS demotion strategy).",
    owner: "Ralph / Jesse",
  },
  scn_om_ca_teva: {
    name: "Order Management — Canada (Teva)",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    scope_storeCount: 34,
    goal: "Prove Canada rollout works while decoupling EBS from B2C order flow.",
    primaryRisk: "Split-brain order ownership + ATP/ATS contract drift during dual-run.",
    decisionNeeded: "MFCS-first vs direct integration (EBS demotion strategy).",
    owner: "Ralph / Jesse",
  },
  "scenario-finance": {
    name: "Finance — Demote EBS to Ledger",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Keep financial posting correct while removing EBS from the live order path.",
    primaryRisk: "COGS/revenue timing mismatch if posting happens before fulfillment confirmation.",
    decisionNeeded: "Posting timing: post-ship async vs near-real-time with controls.",
    owner: "Raj / Finance",
  },
  scn_fin_ebs_demote: {
    name: "Finance — Demote EBS to Ledger",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Keep financial posting correct while removing EBS from the live order path.",
    primaryRisk: "COGS/revenue timing mismatch if posting happens before fulfillment confirmation.",
    decisionNeeded: "Posting timing: post-ship async vs near-real-time with controls.",
    owner: "Raj / Finance",
  },
  "scenario-commerce": {
    name: "Commerce — Bridge Pricing (Temporary)",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Deliver pricing/promo wins early without replatforming everything first.",
    primaryRisk: "Middleware 'temporary' components become permanent; frontend logic debt.",
    decisionNeeded: "Explicit retirement date + kill-switch for bridge components.",
    owner: "Commerce Lead",
  },
  scn_commerce_pricing_bridge: {
    name: "Commerce — Bridge Pricing (Temporary)",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Deliver pricing/promo wins early without replatforming everything first.",
    primaryRisk: "Middleware 'temporary' components become permanent; frontend logic debt.",
    decisionNeeded: "Explicit retirement date + kill-switch for bridge components.",
    owner: "Commerce Lead",
  },
  "scenario-telemetry": {
    name: "Telemetry — Make Conflicts Visible",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Instrument the program so collision risk and cutover health are observable.",
    primaryRisk: "Blind cutovers: no reliable signals for dual-run drift and latency.",
    decisionNeeded: "Minimum telemetry contract + event naming for order/inventory flows.",
    owner: "Platform",
  },
  scn_telemetry_observability: {
    name: "Telemetry — Make Conflicts Visible",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    goal: "Instrument the program so collision risk and cutover health are observable.",
    primaryRisk: "Blind cutovers: no reliable signals for dual-run drift and latency.",
    decisionNeeded: "Minimum telemetry contract + event naming for order/inventory flows.",
    owner: "Platform",
  },
  "scenario-supporting": {
    name: "Supporting Maneuvers — Readiness & Data",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    scope_storeCount: 34,
    goal: "Reduce surprises by grounding rollout phasing in store/region reality.",
    primaryRisk: "Org topology + store footprint mismatch causes sequencing failure.",
    decisionNeeded: "Confirm store list + region ownership rules + blackout windows.",
    owner: "Program",
  },
  scn_support_maneuvers: {
    name: "Supporting Maneuvers — Readiness & Data",
    scope_region: "CA",
    scope_brand: "Teva",
    scope_channels: "B2B · B2C",
    scope_storeCount: 34,
    goal: "Reduce surprises by grounding rollout phasing in store/region reality.",
    primaryRisk: "Org topology + store footprint mismatch causes sequencing failure.",
    decisionNeeded: "Confirm store list + region ownership rules + blackout windows.",
    owner: "Program",
  },
};

const sequenceLoaders: Record<string, () => Promise<ModernizationSequence>> = {
  oms_modernization: () => import("@/data/sequences/oms_modernization.json").then((mod) => mod.default as ModernizationSequence),
  ebs_reduction_sprint: () => import("@/data/sequences/ebs_reduction_sprint.json").then((mod) => mod.default as ModernizationSequence),
  product_pipeline_enhancement: () => import("@/data/sequences/product_pipeline_enhancement.json").then((mod) => mod.default as ModernizationSequence),
  canada_teva_parallel: () => import("@/data/sequences/canada_teva_parallel.json").then((mod) => mod.default as ModernizationSequence),
};

const defaultSequenceId = SEQUENCE_REGISTRY.find((entry) => entry.default)?.id ?? SEQUENCE_REGISTRY[0]?.id ?? "";

type SequenceRegistryEntry = {
  id: string;
  title: string;
  file: string;
  description?: string;
  default?: boolean;
};

type ModernizationScenario = {
  id: string;
  title: string;
  description: string;
  roiDelta: number;
  tccDelta: number;
  riskScore: number;
  readiness: number;
  aleSignals: string[];
  systemCount?: number;
  integrationCount?: number;
  integrationBurden?: IntegrationBurden;
  countries?: string[];
  hypothesis?: string;
  successSignals?: string[];
  learningTags?: string[];
  linkedStageIds?: string[];
};

type TShirtSize = "S" | "M" | "L" | "XL";

const TSHIRT_HEURISTICS: Record<
  TShirtSize,
  { roiDelta: number; tccDelta: number; label: string; systemThreshold: number; integrationThreshold: number }
> = {
  S: { roiDelta: 2.0, tccDelta: -1.0, label: "$$", systemThreshold: 4, integrationThreshold: 10 },
  M: { roiDelta: 3.5, tccDelta: -2.2, label: "$$$", systemThreshold: 7, integrationThreshold: 18 },
  L: { roiDelta: 5.5, tccDelta: -3.8, label: "$$$$", systemThreshold: 11, integrationThreshold: 28 },
  XL: { roiDelta: 7.5, tccDelta: -5.6, label: "$$$$$", systemThreshold: 16, integrationThreshold: 40 },
};

const DEFAULT_INTEGRATION_WEIGHTS = {
  wa: 1,
  wc: 0.7,
  wr: 0.4,
  wdr: 1.2,
  wb: 0.9,
};

const DEFAULT_INTEGRATION_UNIT_COST = 20_000;
const DEFAULT_RIPPLE_MULTIPLIER = 1.05;

const DOMAIN_COMPLEXITY: Record<string, number> = {
  Finance: 1.2,
  Data: 0.9,
};

type ArchitectureComponent = {
  id: string;
  label: string;
  domain?: string;
  state?: string;
  integrationCount?: number;
  integrations?: Array<{ id: string; label: string }>;
  subcomponents?: string[];
};

type StoreRecord = {
  region: string;
  brand: string;
  country: string;
  stores: number;
};

type ConflictDisposition = "accept" | "mitigate" | "resequence" | "split_wave" | "defer";
type EvidenceType = "none" | "note" | "link" | "artifact";

type ConflictDecisionEvent = {
  event_type: "conflict_decision";
  project_id: string;
  scenario_id: string;
  sequence_id: string;
  conflict_id: string;
  selected_disposition: ConflictDisposition;
  severity_adjustment: -2 | -1 | 0 | 1 | 2;
  confidence: number;
  evidence_attached: EvidenceType;
  timestamp: string;
  domain?: string;
  notes?: string;
};

type RiskPosture = {
  score: number;
  band: "Guarded" | "Balanced" | "Aggressive";
  confidence: number;
  last_updated: string;
  n_events: number;
  window_days: number;
};

const DEFAULT_RISK_POSTURE: RiskPosture = {
  score: 0.5,
  band: "Balanced",
  confidence: 0.35,
  last_updated: new Date(0).toISOString(),
  n_events: 0,
  window_days: 90,
};

type IntegrationBurden = {
  adds?: number;
  changes?: number;
  retires?: number;
  dualRun?: number;
  bridge?: number;
  weights?: {
    wa?: number;
    wc?: number;
    wr?: number;
    wdr?: number;
    wb?: number;
  };
  unitCost?: number;
  domainComplexityFactor?: number;
  rippleMultiplier?: number;
  riskFactor?: number;
};

type ModernizationSequence = {
  id: string;
  title: string;
  version?: string;
  domains: string[];
  fyStart: string;
  fyEnd: string;
  roiTarget: number;
  tccTarget: number;
  readinessIndex: number;
  scenarios: ModernizationScenario[];
};

type StoredSequencePayload = {
  prompt: string;
  source?: string;
  graph?: LivingMapData | null;
  aleContext?: AleContext;
};

export function SequencerScene({ projectId }: { projectId: string }) {
  const { log } = useTelemetry("sequencer", { projectId });
  const { ref: stageContainerRef } = useResizeObserver<HTMLDivElement>();
  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [intent, setIntent] = useState("");
  const [source, setSource] = useState("");
  const [sequence, setSequence] = useState<GraphSequencerItem[]>([]);
  const [activePhase, setActivePhase] = useState("FY26");
  const [events, setEvents] = useState<string[]>(["Sequencer ready."]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [selectedSequenceId, setSelectedSequenceId] = useState(defaultSequenceId);
  const [activeSequence, setActiveSequence] = useState<ModernizationSequence | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [inspectorStageId, setInspectorStageId] = useState<string | null>(null);
  const [conflictInspectorStageId, setConflictInspectorStageId] = useState<string | null>(null);
  const [decisionEvents, setDecisionEvents] = useState<ConflictDecisionEvent[]>([]);
  const [activeConflict, setActiveConflict] = useState<{ stageId: string; collision: Collision } | null>(null);
  const [isDecisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [targetForm, setTargetForm] = useState<TargetFormState>({
    goal: "",
    deadlineType: "FY",
    deadlineValue: "FY28",
    regions: "CA",
    brands: "Teva",
    channels: "B2B,B2C",
    budgetMax: "",
    currency: "USD",
    includeHolidayBlackout: true,
  });
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);
  const [isFeasibilityDrawerOpen, setFeasibilityDrawerOpen] = useState(false);
  const [rolePreset, setRolePreset] = useState<RolePreset>("architect");
  const [stageFilters, setStageFilters] = useState<StageFilters>(DEFAULT_STAGE_FILTERS);
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(VIEW_SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ViewSettings>;
          return { ...DEFAULT_VIEW_SETTINGS, ...parsed };
        }
      } catch (err) {
        console.warn("[SequencerScene] failed to parse stored view settings", err);
      }
    }
    return DEFAULT_VIEW_SETTINGS;
  });
  const riskPosture = useMemo(() => computeRiskPosture(decisionEvents), [decisionEvents]);
  const riskPostureScore = riskPosture.score;
  const previousRiskScoreRef = useRef(riskPostureScore);
  const { submitIntent, status: intentStatus, error: intentError } = useSequencerBridge({
    sequence,
    setSequence,
    onConfirmation: (message, context) => {
      setEvents((prev) => [message, ...prev].slice(0, 8));
      log("sequencer.intent_applied", { projectId, mutation: context.mutation.mutationType });
      log("sequencer.user_resolution_applied", {
        projectId,
        resolutionType: context.mutation.mutationType,
        delta: context.mutation,
      });
    },
  });

  useEffect(() => {
    if (previousRiskScoreRef.current === riskPostureScore) return;
    log("risk_posture_updated", {
      projectId,
      score: riskPostureScore,
      band: riskPosture.band,
      confidence: riskPosture.confidence,
      sampleCount: riskPosture.n_events,
      windowDays: riskPosture.window_days,
    });
    previousRiskScoreRef.current = riskPostureScore;
  }, [log, projectId, riskPosture.band, riskPosture.confidence, riskPosture.n_events, riskPosture.window_days, riskPostureScore]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(VIEW_SETTINGS_STORAGE_KEY, JSON.stringify(viewSettings));
    } catch (err) {
      console.warn("[SequencerScene] failed to persist view settings", err);
    }
  }, [viewSettings]);

  const handleRolePresetChange = useCallback(
    (preset: RolePreset) => {
      setRolePreset(preset);
      log("sequencer.role_preset_set", { projectId, preset });
    },
    [log, projectId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("fuxi_sequence_intent");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as StoredSequencePayload;
      const normalizedGraph = payload.graph
        ? {
            nodes: Array.isArray(payload.graph.nodes) ? payload.graph.nodes : [],
            edges: Array.isArray(payload.graph.edges) ? payload.graph.edges : [],
          }
        : null;
      setGraphData(normalizedGraph);
      setIntent(payload.prompt ?? "");
      setSource(payload.source ?? "");
      log("sequencer.hydrated", { projectId, source: payload.source });
      emitAdaptiveEvent("scene:enter", { scene: "sequencer" });
    } catch (err) {
      console.warn("[SequencerScene] failed to hydrate intent", err);
    }
  }, [log, projectId]);

  useEffect(() => {
    let cancelled = false;
    if (graphData) return;
    const fetchGraph = async () => {
      try {
        const response = await fetch(`/api/digital-enterprise/view?project=${projectId}&mode=all`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled) return;
        const graph = payload?.graph ?? payload;
        if (graph?.nodes) {
          setGraphData({
            nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
            edges: Array.isArray(graph.edges) ? graph.edges : [],
          });
        }
      } catch (err) {
        console.error("[SequencerScene] failed to fetch graph data", err);
      }
    };
    fetchGraph();
    return () => {
      cancelled = true;
    };
  }, [graphData, projectId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selectedSequenceId) return;
      setSequenceLoading(true);
      try {
        const loader = sequenceLoaders[selectedSequenceId];
        if (!loader) throw new Error(`No sequence loader for ${selectedSequenceId}`);
        const data = await loader();
        if (cancelled) return;
        const timeline = buildTimeline(data);
        setActiveSequence(data);
        setSequence(timeline);
        setActiveScenarioId(data.scenarios[0]?.id ?? null);
        setActivePhase(timeline[0]?.phase ?? data.fyStart);
        setEvents((prev) => [`Loaded ${data.title}`, ...prev].slice(0, 6));
      } catch (err) {
        console.error("[SequencerScene] failed to load sequence", err);
      } finally {
        if (!cancelled) setSequenceLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedSequenceId]);

  const handleViewSettingToggle = useCallback(
    (key: keyof ViewSettings) => {
      setViewSettings((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        log("sequencer.view_setting_toggled", { projectId, key, value: next[key] });
        return next;
      });
    },
    [log, projectId],
  );

  const handleStageFilterToggle = useCallback(
    (key: "conflictsOnly" | "storeImpactOnly") => {
      setStageFilters((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        log("sequencer.stage_filter_toggled", { projectId, filter: key, value: next[key] });
        return next;
      });
    },
    [log, projectId],
  );

  const handleReadinessFilterChange = useCallback(
    (value: StageFilters["readiness"]) => {
      setStageFilters((prev) => {
        if (prev.readiness === value) return prev;
        const next = { ...prev, readiness: value };
        log("sequencer.stage_filter_readiness_set", { projectId, value });
        return next;
      });
    },
    [log, projectId],
  );

  const focusSummary = useMemo(() => {
    if (activeSequence) {
      const base = `${activeSequence.title} · ${activeSequence.fyStart}–${activeSequence.fyEnd}`;
      if (intent) return `${base} · Derived from intent`;
      if (source) return `${base} · Source ${source}`;
      return base;
    }
    if (intent) return `Derived from user intent: ${intent}`;
    if (source) return `Sequence sourced from ${source}`;
    return "No sequence intent captured yet.";
  }, [activeSequence, intent, source]);

  const hasIntentGraph = Boolean(graphData && graphData.nodes && graphData.nodes.length);
  const architectureComponents = useMemo(() => extractArchitectureComponents(graphData), [graphData]);

  const handleDragStart = useCallback((id: string) => {
    setDraggingId(id);
  }, []);

  const handleDragOver = useCallback(
    (id: string) => {
      if (!draggingId || draggingId === id) return;
      setSequence((prev) => {
        const currentIndex = prev.findIndex((item) => item.id === draggingId);
        const targetIndex = prev.findIndex((item) => item.id === id);
        if (currentIndex === -1 || targetIndex === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(currentIndex, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    },
    [draggingId],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleSimulate = useCallback(
    (phase: string) => {
      setActivePhase(phase);
      setEvents((prev) => [`Simulated ${phase} sequence`, ...prev].slice(0, 6));
      log("sequencer.simulated", { projectId, phase, sequenceLength: sequence.length });
    },
    [log, projectId, sequence.length],
  );

  const handleTargetFormChange = useCallback((field: keyof TargetFormState, value: string | boolean) => {
    setTargetForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const { records: storeRecords } = useStoreData();
  const emptyStageMap = useMemo(() => new Map<string, StageWithTimeline>(), []);
  const collisionContext = useMemo(() => buildCollisionContext(activeSequence), [activeSequence]);
  const stageMap = collisionContext?.stageMap ?? emptyStageMap;
  const collisionReport = collisionContext?.report ?? null;
  const wavePressureMatrix = useMemo(() => computeWavePressureMatrix(stageMap, collisionReport), [stageMap, collisionReport]);
  const loggedConflictKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    loggedConflictKeysRef.current.clear();
  }, [activeSequence?.id]);
  const [wavePressureFocus, setWavePressureFocus] = useState<string | null>(null);
  const [sharedChangeFocus, setSharedChangeFocus] = useState<SharedChangeFocus | null>(null);
  useEffect(() => {
    if (!wavePressureMatrix.size) return;
    const summary = Array.from(wavePressureMatrix.values()).map((entry) => ({ waveId: entry.waveId, score: entry.score }));
    log("wave_pressure_computed", {
      projectId,
      sequenceId: activeSequence?.id ?? "unknown",
      waves: summary,
    });
  }, [activeSequence?.id, log, projectId, wavePressureMatrix]);

  const scenarioIndex = useMemo(() => {
    const map = new Map<string, ModernizationScenario>();
    activeSequence?.scenarios.forEach((scenario) => map.set(scenario.id, scenario));
    return map;
  }, [activeSequence]);

  const submitRoleReviewRun = useCallback(async (payload: RoleReviewRun) => {
    try {
      await fetch("/api/sequences/role-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Non-blocking: role review run capture is best-effort.
    }
  }, []);

  const handleTargetsSubmit = useCallback(() => {
    const regions = targetForm.regions
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const brands = targetForm.brands
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const channels = targetForm.channels
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    const budgetValue = targetForm.budgetMax.trim() ? Number(targetForm.budgetMax.trim()) : undefined;
    const blackoutWindows = targetForm.includeHolidayBlackout ? buildHolidayBlackoutWindows(stageMap, targetForm.deadlineValue) : undefined;
    const targetPayload: Targets = {
      targetId: `target-${Date.now()}`,
      goal: targetForm.goal || "Modernization goal",
      deadline: { type: targetForm.deadlineType, value: targetForm.deadlineValue || "FY28" },
      budget: budgetValue ? { max: budgetValue, currency: targetForm.currency || "USD" } : undefined,
      blackoutWindows: blackoutWindows?.length ? blackoutWindows : undefined,
      scope: {
        regions,
        brands: brands.length ? brands : undefined,
        channels: channels.length ? channels : undefined,
      },
    };
    const feasibilityResult = evaluateFeasibility(targetPayload, stageMap, collisionReport, scenarioIndex, activeSequence, riskPostureScore);
    setTargets(targetPayload);
    setFeasibility(feasibilityResult);
    const reviewId = `review-${Date.now()}`;
    const roleMode = ROLE_REVIEW_MODE_BY_PRESET[rolePreset];
    const findings: RoleReviewFinding[] = feasibilityResult.blockers.map((blocker, index) => ({
      findingId: `${reviewId}-finding-${index + 1}`,
      reviewId,
      severity: blocker.severity === 3 ? "high" : blocker.severity === 2 ? "medium" : "low",
      summary: blocker.summary,
      detail: blocker.suggestions?.join(" ") || undefined,
      stageIds: blocker.evidence?.relatedStageIds,
      systemIds: blocker.evidence?.systems,
      integrationIds: blocker.evidence?.integrations,
      recommendation: blocker.suggestions?.[0],
      decisionNeeded: blocker.code,
      evidenceRefs: blocker.evidence?.window ? [`window:${blocker.evidence.window.start}-${blocker.evidence.window.end}`] : undefined,
    }));
    const reviewRun: RoleReviewRun = {
      reviewId,
      projectId,
      sequenceId: activeSequence?.id ?? "unknown",
      scenarioId: activeScenarioId ?? undefined,
      role: roleMode,
      createdAt: new Date().toISOString(),
      generatedBy: "user",
      findings,
      summary: {
        highCount: findings.filter((entry) => entry.severity === "high").length,
        mediumCount: findings.filter((entry) => entry.severity === "medium").length,
        lowCount: findings.filter((entry) => entry.severity === "low").length,
      },
    };
    void submitRoleReviewRun(reviewRun);
    log("sequencer.targets_set", {
      projectId,
      targetId: targetPayload.targetId,
      goal: targetPayload.goal,
      deadline: targetPayload.deadline,
      scope: targetPayload.scope,
      hasBudget: Boolean(targetPayload.budget),
      hasBlackout: Boolean(targetPayload.blackoutWindows?.length),
    });
    log("sequencer.feasibility_checked", {
      projectId,
      targetId: targetPayload.targetId,
      status: feasibilityResult.status,
      blockerCodes: feasibilityResult.blockers.map((blocker) => blocker.code),
    });
    if (feasibilityResult.status === "NOT_FEASIBLE") {
      log("target_infeasible", {
        projectId,
        targetId: targetPayload.targetId,
        blockerCodes: feasibilityResult.blockers.map((blocker) => blocker.code),
      });
    }
    log("role_review_run", {
      projectId,
      reviewId,
      role: roleMode,
      findings: findings.length,
      sequenceId: activeSequence?.id ?? "unknown",
    });
    setFeasibilityDrawerOpen(true);
  }, [
    activeScenarioId,
    activeSequence,
    collisionReport,
    log,
    projectId,
    riskPostureScore,
    rolePreset,
    scenarioIndex,
    stageMap,
    submitRoleReviewRun,
    targetForm,
  ]);

  const scenarioHypotheses = useMemo(() => buildScenarioHypotheses(activeSequence, stageMap, collisionReport), [activeSequence, stageMap, collisionReport]);
  const scenarioLinkedStageIds = useMemo(() => {
    const map = new Map<string, string[]>();
    scenarioHypotheses.forEach((scenario) => map.set(scenario.id, scenario.linkedStageIds));
    return map;
  }, [scenarioHypotheses]);

  useEffect(() => {
    if (!collisionReport?.collisions.length) return;
    const seen = loggedConflictKeysRef.current;
    collisionReport.collisions.forEach((collision) => {
      const key = `${collision.aStageId}-${collision.bStageId}-${collision.overlap.fyStart}-${collision.overlap.fyEnd}`;
      if (seen.has(key)) return;
      seen.add(key);
      const stageA = stageMap.get(collision.aStageId);
      const stageB = stageMap.get(collision.bStageId);
      log("conflict_detected", {
        projectId,
        sequenceId: activeSequence?.id ?? "unknown",
        stageA: stageA?.title ?? collision.aStageId,
        stageB: stageB?.title ?? collision.bStageId,
        overlapStart: collision.overlap.fyStart,
        overlapEnd: collision.overlap.fyEnd,
        sharedSystems: collision.sharedSystems.slice(0, 5),
        sharedIntegrations: collision.sharedIntegrations.slice(0, 5),
        sharedDomains: collision.sharedDomains.slice(0, 5),
        rules: collision.qualificationRules,
        severity: collision.severity,
      });
    });
  }, [activeSequence?.id, collisionReport, log, projectId, stageMap]);

  const handleScenarioSelect = useCallback(
    (scenarioId: string, linkedStageIds?: string[]) => {
      setConflictInspectorStageId(null);
      setActiveScenarioId(scenarioId);
      const stageCandidates = linkedStageIds?.length ? linkedStageIds : scenarioLinkedStageIds.get(scenarioId) ?? [scenarioId];
      const targetStageId = stageCandidates.find((id) => stageMap.has(id)) ?? stageCandidates[0] ?? null;
      if (targetStageId) {
        setInspectorStageId(targetStageId);
        const timelineItem = sequence.find((item) => item.id === targetStageId);
        if (timelineItem) {
          setActivePhase(timelineItem.phase);
        }
      }
      if (activeSequence) {
        const scenario = activeSequence.scenarios.find((s) => s.id === scenarioId);
        if (scenario) {
          setEvents((prev) => [`Activated ${scenario.title}`, ...prev].slice(0, 6));
        }
      }
      log("sequencer.scenario_focus_set", {
        projectId,
        scenarioId,
        linkedStages: stageCandidates.length,
      });
    },
    [activeSequence, log, projectId, scenarioLinkedStageIds, sequence, stageMap],
  );

  const handleInspectConflicts = useCallback(
    (stageId: string) => {
      const conflicts = collisionReport?.collisionsByStageId?.[stageId] ?? [];
      if (!conflicts.length) return;
      setInspectorStageId(stageId);
      setConflictInspectorStageId(stageId);
      if (activeScenarioId !== stageId) {
        handleScenarioSelect(stageId);
      }
    },
    [activeScenarioId, collisionReport, handleScenarioSelect],
  );

  const handleClearScenarioFocus = useCallback(() => {
    setActiveScenarioId(null);
    setInspectorStageId(null);
    setConflictInspectorStageId(null);
    log("sequencer.scenario_focus_cleared", { projectId });
  }, [log, projectId]);

  const handleWavePressureInspect = useCallback(
    (waveId: string) => {
      const entry = wavePressureMatrix.get(waveId);
      setWavePressureFocus(null);
      if (!entry || !entry.partners.length) {
        setSharedChangeFocus((prev) => (prev?.waveId === waveId ? null : null));
      } else {
        const systems = new Set<string>();
        const integrations = new Set<string>();
        entry.partners.forEach((partner) => {
          partner.sharedSystems.forEach((system) => systems.add(normalizeToken(system)));
          partner.sharedIntegrations.forEach((integration) => integrations.add(normalizeToken(integration)));
        });
        const affectedWaveKeys = new Set<string>([waveId, ...entry.partners.map((partner) => partner.waveId)]);
        setSharedChangeFocus((prev) =>
          prev?.waveId === waveId ? null : { waveId, systems, integrations, affectedWaveKeys },
        );
      }
      log("wave_pressure_reviewed", {
        projectId,
        sequenceId: activeSequence?.id ?? "unknown",
        waveId,
        score: entry?.score ?? 0,
        partnerCount: entry?.partners.length ?? 0,
      });
    },
    [activeSequence?.id, log, projectId, wavePressureMatrix],
  );

  const handleIntentSubmit = useCallback(async () => {
    if (!commandInput.trim()) return;
    const ok = await submitIntent(commandInput);
    if (ok) {
      setCommandInput("");
    }
  }, [commandInput, submitIntent]);

  const handleReviewConflict = useCallback(
    (stageId: string, collision: Collision) => {
      setActiveConflict({ stageId, collision });
      setDecisionDrawerOpen(true);
      const otherStageId = collision.aStageId === stageId ? collision.bStageId : collision.aStageId;
      log("sequencer.conflict_reviewed", {
        projectId,
        sequenceId: activeSequence?.id ?? "unknown",
        stageId,
        otherStageId,
        severity: collision.severity,
        rules: collision.qualificationRules,
        overlapStart: collision.overlap.fyStart,
        overlapEnd: collision.overlap.fyEnd,
      });
    },
    [activeSequence?.id, log, projectId],
  );

  const handleDecisionSubmit = useCallback(
    (input: {
      stageId: string;
      conflict: Collision;
      disposition: ConflictDisposition;
      severityAdjustment: -2 | -1 | 0 | 1 | 2;
      confidence: number;
      evidence: EvidenceType;
      notes?: string;
    }) => {
      const stage = stageMap.get(input.stageId);
      const conflictId = `${input.conflict.aStageId}-${input.conflict.bStageId}-${input.conflict.overlap.fyStart}-${input.conflict.overlap.fyEnd}`;
      const event: ConflictDecisionEvent = {
        event_type: "conflict_decision",
        project_id: projectId,
        scenario_id: input.stageId,
        sequence_id: activeSequence?.id ?? "unknown",
        conflict_id: conflictId,
        selected_disposition: input.disposition,
        severity_adjustment: input.severityAdjustment,
        confidence: input.confidence,
        evidence_attached: input.evidence,
        timestamp: new Date().toISOString(),
        domain: stage?.domainsTouched?.[0],
        notes: input.notes,
      };
      setDecisionEvents((prev) => [...prev, event]);
      const decisionType: DecisionLogEntry["decisionType"] =
        input.disposition === "accept"
          ? "risk_acceptance"
          : input.disposition === "mitigate"
            ? "architecture_option"
            : "sequencing";
      const decisionLog: DecisionLogEntry = {
        decisionId: `decision-${Date.now()}`,
        projectId,
        sequenceId: activeSequence?.id ?? "unknown",
        title: `Conflict decision · ${input.stageId}`,
        decisionType,
        options: ["accept", "mitigate", "resequence", "split_wave", "defer"],
        selectedOption: input.disposition,
        rationale: input.notes,
        linkedConflicts: [conflictId],
        owner: ROLE_PRESETS.find((preset) => preset.id === rolePreset)?.label ?? "Sequencer",
        timestamp: new Date().toISOString(),
      };
      void fetch("/api/sequences/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(decisionLog),
      }).catch(() => null);
      log("sequencer.conflict_decision", {
        projectId,
        sequenceId: event.sequence_id,
        conflictId: event.conflict_id,
        disposition: event.selected_disposition,
        severityAdjustment: event.severity_adjustment,
        confidence: event.confidence,
        evidence: event.evidence_attached,
      });
      log("conflict_reviewed", {
        projectId,
        sequenceId: event.sequence_id,
        conflictId: event.conflict_id,
        stageId: event.scenario_id,
        disposition: event.selected_disposition,
        severityAdjustment: event.severity_adjustment,
        confidence: event.confidence,
        evidence: event.evidence_attached,
      });
      setDecisionDrawerOpen(false);
      setActiveConflict(null);
    },
    [activeSequence?.id, log, projectId, rolePreset, stageMap],
  );

  const sequenceDetails = useMemo(() => SEQUENCE_REGISTRY.find((entry) => entry.id === selectedSequenceId), [selectedSequenceId]);
  const regionScopeByStageId = useMemo(() => {
    const map = new Map<string, string[]>();
    scenarioIndex.forEach((scenario, id) => {
      const countries = scenario.countries?.length ? scenario.countries : inferCountriesForScenario(scenario);
      if (countries.length) {
        map.set(id, countries);
      }
    });
    return map;
  }, [scenarioIndex]);
  const intentTagsByStageId = useMemo(() => {
    const map = new Map<string, string[]>();
    scenarioIndex.forEach((scenario, id) => {
      if (scenario.aleSignals?.length) {
        map.set(id, scenario.aleSignals);
      }
    });
    return map;
  }, [scenarioIndex]);
  const stageAwarenessMap = useMemo(() => {
    const map = new Map<string, StageAwareness>();
    if (!stageMap.size) return map;
    stageMap.forEach((stage, stageId) => {
      const regionScope = regionScopeByStageId.get(stageId) ?? [];
      const awareness = buildStageAwareness({
        stage,
        regionScope,
        storeRecords,
      });
      map.set(stageId, awareness);
    });
    return map;
  }, [stageMap, regionScopeByStageId, storeRecords]);
  const stageMapSignature = useMemo(() => {
    if (!stageMap.size) return "";
    return Array.from(stageMap.keys()).join("|");
  }, [stageMap]);

  useEffect(() => {
    if (!targets) return;
    const result = evaluateFeasibility(targets, stageMap, collisionReport, scenarioIndex, activeSequence, riskPostureScore);
    setFeasibility(result);
  }, [activeSequence, collisionReport, riskPostureScore, scenarioIndex, stageMap, stageMapSignature, targets]);
  const stageAwarenessSignature = useMemo(() => {
    if (!stageAwarenessMap.size) return "";
    return Array.from(stageAwarenessMap.entries())
      .map(([stageId, awareness]) => `${stageId}:${awareness.confidence.overall.toFixed(2)}`)
      .join("|");
  }, [stageAwarenessMap]);
  const activeScenarioStageIds = useMemo(() => (activeScenarioId ? scenarioLinkedStageIds.get(activeScenarioId) ?? [] : []), [activeScenarioId, scenarioLinkedStageIds]);
  const scenarioFilterActive = activeScenarioStageIds.length > 0;
  const scenarioFilterStageSet = useMemo(() => new Set(activeScenarioStageIds), [activeScenarioStageIds]);
  const activeScenarioMeta = useMemo(() => {
    if (!activeScenarioId) return null;
    const hypothesis = scenarioHypotheses.find((item) => item.id === activeScenarioId);
    const brief = SCENARIO_BRIEFS[activeScenarioId];
    const sequenceScenario = activeSequence?.scenarios.find((scenario) => scenario.id === activeScenarioId);
    const title = brief?.name ?? hypothesis?.title ?? sequenceScenario?.title ?? "Scenario focus";
    const scopeParts = [brief?.scope_region, brief?.scope_brand, brief?.scope_channels].filter(Boolean);
    const scope = scopeParts.length ? scopeParts.join(" · ") : hypothesis?.regionLabel;
    return { title, scope };
  }, [activeScenarioId, activeSequence?.scenarios, scenarioHypotheses]);
  const stageJumpSequence = useMemo(() => {
    if (!sequence.length) return sequence;
    return sequence.map((item) => {
      const stage = stageMap.get(item.id);
      const conflicts = collisionReport?.collisionsByStageId?.[item.id] ?? [];
      const regions = regionScopeByStageId.get(item.id) ?? [];
      return {
        ...item,
        systemsTouchedCount: stage?.systemsTouched?.length ?? 0,
        integrationsTouchedCount: stage?.integrationsTouched?.length ?? 0,
        conflictCount: conflicts.length,
        timeWindowLabel: stage ? formatStageWindow(stage) : undefined,
        regions,
      };
    });
  }, [sequence, stageMap, collisionReport, regionScopeByStageId]);
  const conflictSummary = useMemo(
    () => buildConflictSummary(collisionReport, stageMap, scenarioFilterActive ? scenarioFilterStageSet : undefined),
    [collisionReport, scenarioFilterActive, scenarioFilterStageSet, stageMap],
  );
  const stageDetailFallbackId = activeScenarioStageIds[0] ?? null;
  const detailStageId = inspectorStageId ?? stageDetailFallbackId ?? null;
  const stageHighlightId = inspectorStageId ?? stageDetailFallbackId ?? null;

  const sequenceLoadRef = useRef<string | null>(null);
  const stageRenderLogRef = useRef<Set<string>>(new Set());
  const collisionLogRef = useRef<Set<string>>(new Set());
  const draftPersistRef = useRef<string | null>(null);

  useEffect(() => {
    if (inspectorStageId && !stageMap.has(inspectorStageId)) {
      setInspectorStageId(null);
    }
    if (conflictInspectorStageId && !stageMap.has(conflictInspectorStageId)) {
      setConflictInspectorStageId(null);
    }
    if (conflictInspectorStageId) {
      const conflicts = collisionReport?.collisionsByStageId?.[conflictInspectorStageId] ?? [];
      if (!conflicts.length) {
        setConflictInspectorStageId(null);
      }
    }
  }, [collisionReport, conflictInspectorStageId, inspectorStageId, stageMap]);

  useEffect(() => {
    setInspectorStageId(null);
    setConflictInspectorStageId(null);
  }, [activeSequence?.id]);
  useEffect(() => {
    stageRenderLogRef.current = new Set();
    collisionLogRef.current = new Set();
    draftPersistRef.current = null;
    sequenceLoadRef.current = null;
  }, [activeSequence?.id]);

  useEffect(() => {
    if (!activeSequence || !stageMap.size) return;
    const key = `${activeSequence.id}:${stageMapSignature}`;
    if (sequenceLoadRef.current === key) return;
    sequenceLoadRef.current = key;
    const nodeCountTouched = collectUniqueCount(stageMap, "systemsTouched");
    const edgeCountTouched = collectUniqueCount(stageMap, "integrationsTouched");
    log("sequencer.sequence_loaded", {
      projectId,
      sequenceId: activeSequence.id,
      version: activeSequence.version ?? "static-seed",
      stageCount: stageMap.size,
      nodeCountTouched,
      edgeCountTouched,
    });
  }, [activeSequence, stageMap, stageMapSignature, log, projectId]);

  useEffect(() => {
    if (!activeSequence || !stageMap.size) return;
    stageMap.forEach((stage, stageId) => {
      if (stageRenderLogRef.current.has(stageId)) return;
      stageRenderLogRef.current.add(stageId);
      const awareness = stageAwarenessMap.get(stageId);
      log("sequencer.stage_rendered", {
        projectId,
        sequenceId: activeSequence.id,
        stageId,
        systemsTouched: stage.systemsTouched?.length ?? 0,
        integrationsTouched: stage.integrationsTouched?.length ?? 0,
        awareness,
      });
    });
  }, [activeSequence, stageMap, stageAwarenessMap, log, projectId]);

  useEffect(() => {
    if (!activeSequence || !collisionReport) return;
    collisionReport.collisions.forEach((entry) => {
      const collisionId = `${entry.aStageId}:${entry.bStageId}:${entry.overlap.fyStart}:${entry.overlap.fyEnd}`;
      if (collisionLogRef.current.has(collisionId)) return;
      collisionLogRef.current.add(collisionId);
      const type = entry.sharedIntegrations.length
        ? "shared_edge"
        : entry.sharedSystems.length
          ? "shared_node"
          : "shared_domain";
      log("sequencer.collision_detected", {
        projectId,
        sequenceId: activeSequence.id,
        collisionId,
        type,
        stageA: entry.aStageId,
        stageB: entry.bStageId,
        entities: [...entry.sharedIntegrations, ...entry.sharedSystems, ...entry.sharedDomains],
        sharedSystems: entry.sharedSystems,
        sharedIntegrations: entry.sharedIntegrations,
        sharedDomains: entry.sharedDomains,
        severity: entry.severity,
        rules: entry.qualificationRules,
        confidence: 0.75,
        provenance: "explicit",
      });
    });
  }, [activeSequence, collisionReport, log, projectId]);

  useEffect(() => {
    if (!activeSequence || !stageMap.size) return;
    if (!stageAwarenessMap.size || stageAwarenessMap.size !== stageMap.size) return;
    const key = `${activeSequence.id}:${stageMapSignature}:${stageAwarenessSignature}`;
    if (draftPersistRef.current === key) return;
    draftPersistRef.current = key;
    const draft = buildSequenceDraft({
      projectId,
      sequence: {
        id: activeSequence.id,
        title: activeSequence.title,
        version: activeSequence.version,
        fyStart: activeSequence.fyStart,
        fyEnd: activeSequence.fyEnd,
      },
      stageMap,
      awarenessByStageId: stageAwarenessMap,
      regionScopeByStageId,
      intentTagsByStageId,
      provenance: [{ sourceType: "manual", note: "Sequencer static dataset" }],
    });
    void fetch("/api/sequences/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    })
      .then((response) => {
        if (response.ok) {
          log("sequencer.sequence_saved", {
            projectId,
            sequenceId: draft.sequenceId,
            stageCount: draft.stageCount,
          });
          const snapshot = {
            snapshotId: `snapshot-${Date.now()}`,
            projectId,
            sequenceId: draft.sequenceId,
            version: draft.version,
            createdAt: new Date().toISOString(),
            source: "auto_checkpoint",
            sequence: draft,
          };
          void fetch("/api/sequences/snapshots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snapshot),
          }).catch(() => null);
        }
      })
      .catch((err) => {
        console.warn("[SequencerScene] failed to persist sequence draft", err);
      });
  }, [
    activeSequence,
    intentTagsByStageId,
    log,
    projectId,
    regionScopeByStageId,
    stageAwarenessMap,
    stageAwarenessSignature,
    stageMap,
    stageMapSignature,
  ]);

  const leftRailContent = (
    <div className="space-y-5 text-sm text-slate-700">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sequence</p>
        <select
          value={selectedSequenceId}
          onChange={(event) => setSelectedSequenceId(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
        >
          {SEQUENCE_REGISTRY.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.title}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">{sequenceDetails?.description}</p>
      </div>
      {sequenceLoading ? (
        <p className="text-xs text-slate-500">Loading modernization data…</p>
      ) : activeSequence ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">FY Start</p>
              <p>{activeSequence.fyStart}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="font-semibold text-slate-900">FY End</p>
              <p>{activeSequence.fyEnd}</p>
            </div>
          </div>
          <TargetsPanel targets={targets} form={targetForm} onFieldChange={handleTargetFormChange} onSubmit={handleTargetsSubmit} />
        </div>
      ) : null}
      <ScenarioHypothesisList items={scenarioHypotheses} activeScenarioId={activeScenarioId} onSelect={handleScenarioSelect} />
    </div>
  );

  const navigatorCard = (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Sequencer Navigator</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ROLE_PRESETS.map((preset) => {
          const active = rolePreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={active}
              title={preset.description}
              onClick={() => handleRolePresetChange(preset.id)}
              className={clsx(
                "rounded-full border px-3 py-1 text-[0.65rem] font-semibold transition",
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {VIEW_TOGGLE_OPTIONS.map((option) => {
          const active = viewSettings[option.key];
          return (
            <button
              key={option.key}
              type="button"
              title={option.helper}
              aria-pressed={active}
              onClick={() => handleViewSettingToggle(option.key)}
              className={clsx(
                "rounded-full border px-3 py-1 text-[0.65rem] font-semibold transition",
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Stage filters</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={stageFilters.conflictsOnly}
            onClick={() => handleStageFilterToggle("conflictsOnly")}
            className={clsx(
              "rounded-full border px-3 py-1 text-[0.65rem] font-semibold transition",
              stageFilters.conflictsOnly ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
            )}
          >
            Conflicts only
          </button>
          <button
            type="button"
            aria-pressed={stageFilters.storeImpactOnly}
            onClick={() => handleStageFilterToggle("storeImpactOnly")}
            className={clsx(
              "rounded-full border px-3 py-1 text-[0.65rem] font-semibold transition",
              stageFilters.storeImpactOnly ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400",
            )}
          >
            Store impact
          </button>
        </div>
        <label className="mt-3 block text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
          Readiness filter
          <select
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[0.75rem] font-semibold text-slate-700 focus:border-slate-400 focus:outline-none"
            value={stageFilters.readiness}
            onChange={(event) => handleReadinessFilterChange(event.target.value as StageFilters["readiness"])}
          >
            {READINESS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );

  const rightRailContent = (
    <div className="space-y-4">
      {navigatorCard}
      {conflictSummary ? (
        <div className="rounded-3xl border border-amber-100 bg-white p-4 text-sm text-amber-800 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-500">
            <span>Conflicts</span>
            <span className="text-[0.65rem] font-semibold tracking-normal text-amber-700">
              {conflictSummary.total} total · H {conflictSummary.high} / M {conflictSummary.medium} / L {conflictSummary.low}
            </span>
          </div>
          {scenarioFilterActive && activeScenarioMeta?.title ? (
            <p className="mt-1 text-[0.65rem] text-amber-700">
              Filtered to {activeScenarioMeta.title}
              {activeScenarioMeta.scope ? ` · ${activeScenarioMeta.scope}` : ""}
            </p>
          ) : null}
          <ConflictSummaryCard summary={conflictSummary} onInspect={(stageId) => setInspectorStageId(stageId)} />
        </div>
      ) : null}
      <StageJumpListCard
        sequence={stageJumpSequence}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        activePhase={activePhase}
        onSimulate={handleSimulate}
        highlightStageId={stageHighlightId}
      />
      <ApplyIntentCard
        value={commandInput}
        onChange={setCommandInput}
        onSubmit={handleIntentSubmit}
        status={intentStatus}
        error={intentError}
      />
      <StageDetailCard
        stageId={detailStageId}
        stageMap={stageMap}
        scenarioIndex={scenarioIndex}
        awarenessMap={stageAwarenessMap}
        regionScopeByStageId={regionScopeByStageId}
        intentTagsByStageId={intentTagsByStageId}
        collisionReport={collisionReport}
        riskPostureScore={riskPostureScore}
        showStoreCoverage={viewSettings.showStoreCoverage}
      />
      <GraphEventConsole events={events} emptyMessage="Interact with the sequence to see optimization prompts." />
    </div>
  );

  const resolvedLeftRail = rolePreset === "overview" ? leftRailContent : null;
  const resolvedRightRail = rightRailContent;

  // Layout contract (D089/D100): SceneTemplate provides the global rails and dedicated operator stack.
  return (
    <>
      <SceneTemplate
      leftRail={resolvedLeftRail}
      rightRail={resolvedRightRail}
    >
      <div ref={stageContainerRef} className="flex h-full flex-1">
        <Stage padded={false} className="h-full">
          <div className="border-b border-slate-200 px-6 py-4 text-slate-900">
            <h2 className="text-2xl font-semibold">Sequencer Timeline</h2>
            <p className="text-sm text-slate-600">{activeSequence ? activeSequence.title : "Select a sequence to begin."}</p>
            <p className="text-xs text-slate-500">{focusSummary}</p>
            {feasibility ? (
              <FeasibilityBanner result={feasibility} onShowDetails={() => setFeasibilityDrawerOpen(true)} />
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-900">
                Risk Posture · {riskPosture.band} ({riskPostureScore.toFixed(2)})
              </span>
              <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                Confidence {Math.round(riskPosture.confidence * 100)}%
              </span>
            </div>
            {scenarioFilterActive ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-[0.7rem] text-indigo-800">
                <span>
                  Focused on {activeScenarioMeta?.title ?? "selected scenario"}
                  {activeScenarioMeta?.scope ? ` · ${activeScenarioMeta.scope}` : ""}
                </span>
                <button
                  type="button"
                  className="text-[0.65rem] font-semibold text-indigo-700 underline-offset-2 hover:underline"
                  onClick={handleClearScenarioFocus}
                >
                  Clear focus
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex-1 space-y-4 p-4">
            {hasIntentGraph ? (
              <SequencerRoadmap
                sequence={activeSequence}
                onScenarioSelect={handleScenarioSelect}
                components={architectureComponents}
                storeRecords={storeRecords}
                stageMap={stageMap}
                collisionReport={collisionReport}
                onInspectConflicts={handleInspectConflicts}
                inspectorStageId={inspectorStageId}
                regionScopeByStageId={regionScopeByStageId}
                riskPostureScore={riskPostureScore}
                activeStageIds={activeScenarioStageIds}
                stageFilters={stageFilters}
                stageAwarenessMap={stageAwarenessMap}
                viewSettings={viewSettings}
                wavePressureMatrix={wavePressureMatrix}
                onWavePressureInspect={handleWavePressureInspect}
                sharedChangeFocus={sharedChangeFocus}
                scenarioFilterStageIds={activeScenarioStageIds}
                scenarioFilterActive={scenarioFilterActive}
              />
            ) : (
              <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
                Upload a future-state map or intent to render the modernization timeline.
              </div>
            )}
          </div>
        </Stage>
      </div>
      </SceneTemplate>
      <ConflictDecisionDrawer
        open={Boolean(isDecisionDrawerOpen && activeConflict)}
        conflict={activeConflict}
        stageMap={stageMap}
        onClose={() => {
          setDecisionDrawerOpen(false);
          setActiveConflict(null);
        }}
        onSubmit={handleDecisionSubmit}
      />
      <ConflictInspectorDrawer
        open={Boolean(conflictInspectorStageId)}
        stageId={conflictInspectorStageId}
        stageMap={stageMap}
        report={collisionReport}
        onClose={() => setConflictInspectorStageId(null)}
        onJump={handleScenarioSelect}
        onReview={handleReviewConflict}
        riskPostureScore={riskPostureScore}
      />
      <WavePressureDrawer open={Boolean(wavePressureFocus)} waveId={wavePressureFocus} matrix={wavePressureMatrix} onClose={() => setWavePressureFocus(null)} />
      <FeasibilityDetailsDrawer
        open={Boolean(isFeasibilityDrawerOpen && feasibility && targets)}
        result={feasibility}
        targets={targets}
        onClose={() => setFeasibilityDrawerOpen(false)}
      />
    </>
  );
}

type RoadmapStageItem = {
  scenario: ModernizationScenario;
  waveLabel: string;
  stage?: StageWithTimeline;
};

type RoadmapLane = {
  id: string;
  label: string;
  waveId?: string;
  items: RoadmapStageItem[];
};

type RoadmapColumn = {
  id: string;
  label: string;
  lanes: RoadmapLane[];
  items: RoadmapStageItem[];
};

type RoadmapColumnMetrics = {
  columnId: string;
  totalTcc: number;
  roiPercent: number;
  benefitValue: number;
  readinessAvg: number;
  riskAvg: number;
  cumulativeCost: number;
  cumulativeBenefit: number;
  integrationCost: number;
};

function SequencerRoadmap({
  sequence,
  onScenarioSelect,
  components = [],
  storeRecords = [],
  stageMap,
  collisionReport,
  onInspectConflicts,
  inspectorStageId,
  regionScopeByStageId,
  riskPostureScore,
  activeStageIds,
  stageFilters,
  stageAwarenessMap,
  viewSettings,
  wavePressureMatrix,
  onWavePressureInspect,
  sharedChangeFocus,
  scenarioFilterStageIds = [],
  scenarioFilterActive = false,
}: {
  sequence: ModernizationSequence | null;
  onScenarioSelect?: (scenarioId: string, linkedStageIds?: string[]) => void;
  components?: ArchitectureComponent[];
  storeRecords?: StoreRecord[];
  stageMap: Map<string, StageWithTimeline>;
  collisionReport: CollisionReport | null;
  onInspectConflicts?: (stageId: string) => void;
  inspectorStageId: string | null;
  regionScopeByStageId: Map<string, string[]>;
  riskPostureScore: number;
  activeStageIds: string[];
  stageFilters: StageFilters;
  stageAwarenessMap: Map<string, StageAwareness>;
  viewSettings: ViewSettings;
  wavePressureMatrix: WavePressureMatrix;
  onWavePressureInspect?: (waveId: string) => void;
  sharedChangeFocus?: SharedChangeFocus | null;
  scenarioFilterStageIds?: string[];
  scenarioFilterActive?: boolean;
}) {
  const { showRoadmapOverlay, showStoreCoverage, showReadiness, showConflictBadges, showArchitectureComponents } = viewSettings;
  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);
  const [focusedColumnId, setFocusedColumnId] = useState<string | null>(null);
  const columns = useMemo(() => buildRoadmapColumns(sequence, stageMap), [sequence, stageMap]);
  const overlay = useMemo(() => computeRoadmapMetrics(sequence, columns, riskPostureScore), [sequence, columns, riskPostureScore]);
  const stageColumnMap = useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((column) => {
      column.items.forEach((item) => {
        const stageId = item.stage?.stageId ?? item.scenario.id;
        map.set(stageId, column.id);
      });
    });
    return map;
  }, [columns]);
  const columnTouchedMap = useMemo(() => {
    const touched = new Map<string, { systems: Set<string>; integrations: Set<string> }>();
    columns.forEach((column) => {
      const systems = new Set<string>();
      const integrations = new Set<string>();
      column.items.forEach((item) => {
        item.stage?.systemsTouched?.forEach((system) => systems.add(normalizeToken(system)));
        item.stage?.integrationsTouched?.forEach((integration) => integrations.add(normalizeToken(integration)));
      });
      touched.set(column.id, { systems, integrations });
    });
    return touched;
  }, [columns]);
  const columnWaveKeys = useMemo(() => {
    const map = new Map<string, Set<string>>();
    columns.forEach((column) => {
      const keys = new Set<string>();
      column.lanes.forEach((lane) => {
        const waveKey = getWaveKey(lane.waveId, lane.label);
        keys.add(waveKey);
      });
      map.set(column.id, keys);
    });
    return map;
  }, [columns]);
  const stageHighlight = useMemo(() => {
    if (!inspectorStageId) return null;
    const stage = stageMap.get(inspectorStageId);
    if (!stage) return null;
    const systems = new Set<string>();
    const integrations = new Set<string>();
    stage.systemsTouched?.forEach((system) => systems.add(normalizeToken(system)));
    stage.integrationsTouched?.forEach((integration) => integrations.add(normalizeToken(integration)));
    return { systems, integrations };
  }, [inspectorStageId, stageMap]);
  const stageHighlightColumnId = useMemo(
    () => (inspectorStageId ? stageColumnMap.get(inspectorStageId) ?? null : null),
    [inspectorStageId, stageColumnMap],
  );
  const sharedChangeColumnSet = useMemo(() => {
    if (!sharedChangeFocus) return new Set<string>();
    const matched = new Set<string>();
    columnWaveKeys.forEach((keys, columnId) => {
      for (const key of keys) {
        if (sharedChangeFocus.affectedWaveKeys.has(key)) {
          matched.add(columnId);
          break;
        }
      }
    });
    return matched;
  }, [columnWaveKeys, sharedChangeFocus]);
  const columnComponents = useMemo(
    () => allocateComponentsToColumns(sequence, columns, components),
    [sequence, columns, components],
  );
  const columnStoreCoverage = useMemo(
    () => computeStoreCoverage(columns, storeRecords),
    [columns, storeRecords],
  );
  const scenarioFilterSet = useMemo(() => new Set(scenarioFilterStageIds), [scenarioFilterStageIds]);
  const handleIntegrationToggle = useCallback((componentId: string) => {
    setExpandedComponentId((prev) => (prev === componentId ? null : componentId));
  }, []);
  const handleColumnFocusToggle = useCallback((columnId: string) => {
    setFocusedColumnId((prev) => (prev === columnId ? null : columnId));
  }, []);
  if (!sequence || !columns.length) {
    return (
      <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/70 p-6 text-sm text-slate-500">
        No roadmap available yet. Select or build a sequence to preview the future architecture.
      </div>
    );
  }
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Future architecture roadmap</p>
          <p className="text-xs text-slate-500">
            {sequence.fyStart} → {sequence.fyEnd}
          </p>
          <p className="text-[0.65rem] text-slate-400">Readiness and risk snapshots per lane.</p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 py-4">
        {columns.map((column) => {
          const hasSharedChange = sharedChangeFocus && sharedChangeColumnSet.has(column.id);
          return (
            <div key={column.id} className="min-w-[220px] flex-1 rounded-3xl border border-slate-100 bg-slate-50/80 p-3">
            <button
              type="button"
              onClick={() => handleColumnFocusToggle(column.id)}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">{column.label}</span>
              {showArchitectureComponents ? (
                <span className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
                  {focusedColumnId === column.id ? "Collapse" : "Focus"}
                </span>
              ) : null}
            </button>
            {focusedColumnId === column.id || stageHighlightColumnId === column.id || hasSharedChange ? (
              <p className="mt-1 text-[0.6rem] text-slate-400">
                systems affected{" "}
                {hasSharedChange && sharedChangeFocus
                  ? sharedChangeFocus.systems.size
                  : stageHighlight && stageHighlightColumnId === column.id
                  ? stageHighlight.systems.size
                  : columnTouchedMap.get(column.id)?.systems.size ?? 0}{" "}
                · integrations{" "}
                {hasSharedChange && sharedChangeFocus
                  ? sharedChangeFocus.integrations.size
                  : stageHighlight && stageHighlightColumnId === column.id
                  ? stageHighlight.integrations.size
                  : columnTouchedMap.get(column.id)?.integrations.size ?? 0}
              </p>
            ) : null}
            <div className="mt-3 space-y-4">
              {column.lanes.map((lane) => {
                const laneWaveKey = getWaveKey(lane.waveId, lane.label);
                const lanePressureEntry = wavePressureMatrix.get(laneWaveKey);
                const pressureLevel =
                  lanePressureEntry && lanePressureEntry.score >= WAVE_PRESSURE_HIGH_THRESHOLD
                    ? "High"
                    : lanePressureEntry && lanePressureEntry.score >= WAVE_PRESSURE_MEDIUM_THRESHOLD
                    ? "Medium"
                    : null;
                return (
                  <div key={lane.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">{lane.label}</p>
                      {pressureLevel ? (
                        <button
                          type="button"
                          onClick={() => onWavePressureInspect?.(laneWaveKey)}
                          className={clsx(
                            "rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.2em]",
                            lanePressureEntry?.score && lanePressureEntry.score >= WAVE_PRESSURE_HIGH_THRESHOLD
                              ? "border-rose-300 bg-rose-50 text-rose-700"
                              : "border-amber-300 bg-amber-50 text-amber-700",
                          )}
                        >
                          Shared-change · {pressureLevel}
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {lane.items.map((item) => {
                        const cardStageId = item.stage?.stageId ?? item.scenario.id;
                        const isFiltered = scenarioFilterActive && !scenarioFilterSet.has(cardStageId);
                        const awareness = stageAwarenessMap.get(cardStageId);
                        return (
                          <TimelineStageCard
                            key={item.scenario.id}
                            scenario={item.scenario}
                            stage={item.stage}
                            waveLabel={item.waveLabel}
                            isActive={activeStageIds.includes(cardStageId)}
                            isInspected={cardStageId === inspectorStageId}
                            onScenarioSelect={onScenarioSelect}
                            regionScope={regionScopeByStageId.get(item.scenario.id) ?? []}
                            collisionReport={collisionReport}
                            stageMap={stageMap}
                            onInspectConflicts={onInspectConflicts}
                            riskPostureScore={riskPostureScore}
                            showReadiness={showReadiness}
                            showConflictBadges={showConflictBadges}
                            isFiltered={isFiltered}
                            storeFootprint={awareness?.storeFootprint}
                            stageFilters={stageFilters}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <RoadmapColumnOverlay metrics={overlay?.metrics.find((metric) => metric.columnId === column.id)} enabled={showRoadmapOverlay} />
            {showArchitectureComponents && (!focusedColumnId || focusedColumnId === column.id) ? (
              <ArchitectureComponentList
                items={columnComponents.get(column.id) ?? []}
                expandedComponentId={expandedComponentId}
                onToggle={handleIntegrationToggle}
                highlight={
                  hasSharedChange && sharedChangeFocus
                    ? sharedChangeFocus
                    : stageHighlight && stageHighlightColumnId === column.id
                    ? stageHighlight
                    : focusedColumnId === column.id
                    ? columnTouchedMap.get(column.id)
                    : null
                }
                highlightTone={hasSharedChange ? "shared" : "default"}
                autoExpandIntegrations={
                  focusedColumnId === column.id || stageHighlightColumnId === column.id || hasSharedChange
                }
              />
            ) : null}
            {showStoreCoverage ? <StoreCoverageList coverage={columnStoreCoverage.get(column.id)} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoadmapColumnOverlay({ metrics, enabled }: { metrics?: RoadmapColumnMetrics; enabled: boolean }) {
  if (!enabled || !metrics) return null;
  const readinessPercent = Math.round(metrics.readinessAvg * 100);
  const riskPercent = Math.round(metrics.riskAvg * 100);
  return (
    <div className="mt-4 rounded-2xl border border-white/40 bg-white/80 p-3 text-[0.7rem] text-slate-600 shadow-sm">
      <div className="flex items-center justify-between text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
        <span>Readiness</span>
        <span className="text-slate-600 text-[0.75rem] font-semibold text-slate-900">{readinessPercent}%</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">
        <span>Risk</span>
        <span className="text-slate-600 text-[0.75rem] font-semibold text-slate-900">{riskPercent}%</span>
      </div>
    </div>
  );
}

function getWaveColorClass(label: string): string {
  const match = label.match(/wave\s*(\d+)/i);
  if (match) {
    const index = (Number(match[1]) - 1 + WAVE_COLOR_CLASSES.length) % WAVE_COLOR_CLASSES.length;
    return WAVE_COLOR_CLASSES[index];
  }
  return "bg-slate-100 text-slate-700";
}

function describeCollisionRules(rules: CollisionRule[]): string {
  if (!rules.length) return "";
  return rules.map((rule) => COLLISION_RULE_LABELS[rule] ?? rule).join(" • ");
}

function buildTimeline(sequence: ModernizationSequence): GraphSequencerItem[] {
  const bands = buildFiscalBands(sequence.fyStart, sequence.fyEnd, sequence.scenarios.length);
  return sequence.scenarios.map((scenario, index) => {
    const fin = resolveScenarioFinancials(sequence, scenario);
    const tccValue = sequence.tccTarget + fin.tccDelta;
    const roiValue = (sequence.roiTarget + fin.roiDelta) / 100;
    return {
      id: scenario.id,
      label: scenario.title,
      phase: bands[index] ?? sequence.fyStart,
      region: scenario.description,
      cost: Number(Math.abs(tccValue).toFixed(1)),
      impact: Math.max(0, roiValue),
    };
  });
}

function buildFiscalBands(start: string, end: string, desiredLength: number): string[] {
  const startYear = parseFiscalYear(start);
  const endYear = parseFiscalYear(end);
  if (!startYear || !endYear) return Array.from({ length: desiredLength }, (_, idx) => `${start} · Wave ${idx + 1}`);
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  const bands: string[] = [];
  const repeats = Math.ceil(desiredLength / years.length);
  for (let r = 0; r < repeats; r += 1) {
    years.forEach((year) => {
      if (bands.length < desiredLength) {
        bands.push(`FY${year} Wave ${bands.length + 1}`);
      }
    });
  }
  return bands;
}

function parseFiscalYear(label: string): number {
  const matches = label.match(/FY(\d{2})/i);
  if (!matches) return 0;
  return Number(matches[1]);
}

type ScenarioFinancials = {
  roiDelta: number;
  tccDelta: number;
  estimated: boolean;
  size: TShirtSize;
};

function resolveScenarioFinancials(sequence: ModernizationSequence, scenario: ModernizationScenario): ScenarioFinancials {
  const hasRoi = Number.isFinite(scenario.roiDelta);
  const hasTcc = Number.isFinite(scenario.tccDelta);
  if (hasRoi && hasTcc) {
    return { roiDelta: scenario.roiDelta, tccDelta: scenario.tccDelta, estimated: false, size: inferWorkloadSize(scenario) };
  }
  const size = inferWorkloadSize(scenario);
  const heuristics = TSHIRT_HEURISTICS[size];
  return {
    roiDelta: hasRoi ? scenario.roiDelta : heuristics.roiDelta,
    tccDelta: hasTcc ? scenario.tccDelta : heuristics.tccDelta,
    estimated: !(hasRoi && hasTcc),
    size,
  };
}

function inferWorkloadSize(scenario: ModernizationScenario): TShirtSize {
  const systems = scenario.systemCount ?? 5;
  const integrations = scenario.integrationCount ?? 12;
  if (systems >= TSHIRT_HEURISTICS.XL.systemThreshold || integrations >= TSHIRT_HEURISTICS.XL.integrationThreshold) return "XL";
  if (systems >= TSHIRT_HEURISTICS.L.systemThreshold || integrations >= TSHIRT_HEURISTICS.L.integrationThreshold) return "L";
  if (systems >= TSHIRT_HEURISTICS.M.systemThreshold || integrations >= TSHIRT_HEURISTICS.M.integrationThreshold) return "M";
  return "S";
}

function resolveIntegrationBurden(
  scenario: ModernizationScenario,
  sequence: ModernizationSequence | null,
  riskPostureScore = DEFAULT_RISK_POSTURE.score,
): { ibi: number; cost: number; details: Required<IntegrationBurden> } {
  const details = scenario.integrationBurden ?? {};
  const weights = {
    wa: details.weights?.wa ?? DEFAULT_INTEGRATION_WEIGHTS.wa,
    wc: details.weights?.wc ?? DEFAULT_INTEGRATION_WEIGHTS.wc,
    wr: details.weights?.wr ?? DEFAULT_INTEGRATION_WEIGHTS.wr,
    wdr: details.weights?.wdr ?? DEFAULT_INTEGRATION_WEIGHTS.wdr,
    wb: details.weights?.wb ?? DEFAULT_INTEGRATION_WEIGHTS.wb,
  };
  const estimatedAdds = scenario.integrationCount ?? Math.max(2, (scenario.systemCount ?? 3) * 2);
  const adds = details.adds ?? estimatedAdds;
  const changes = details.changes ?? Math.round(adds * 0.4);
  const retires = details.retires ?? Math.round(adds * 0.2);
  const dualRun = details.dualRun ?? (sequence?.domains.length ?? 0) > 1 ? 1 : 0;
  const bridge = details.bridge ?? (adds > 10 ? 2 : 1);
  const unitCost = details.unitCost ?? DEFAULT_INTEGRATION_UNIT_COST;
  const domain = sequence?.domains?.[0] ?? "";
  const domainFactor = details.domainComplexityFactor ?? DOMAIN_COMPLEXITY[domain] ?? 1;
  const ripple = details.rippleMultiplier ?? DEFAULT_RIPPLE_MULTIPLIER;
  const ibi = adds * weights.wa + changes * weights.wc + retires * weights.wr + dualRun * weights.wdr + bridge * weights.wb;
  const rawCost = ibi * unitCost * domainFactor * ripple;
  const riskFactor = 0.05 + 0.35 * clamp01(riskPostureScore);
  const cost = (rawCost * (1 + riskFactor)) / 1_000_000;
  return {
    ibi,
    cost,
    details: {
      adds,
      changes,
      retires,
      dualRun,
      bridge,
      weights,
      unitCost,
      domainComplexityFactor: domainFactor,
      rippleMultiplier: ripple,
      riskFactor,
    },
  };
}

function buildRoadmapColumns(sequence: ModernizationSequence | null, stageMap: Map<string, StageWithTimeline>): RoadmapColumn[] {
  if (!sequence || !sequence.scenarios.length) return [];
  const bands = buildFiscalBands(sequence.fyStart, sequence.fyEnd, sequence.scenarios.length);
  const columnMap = new Map<string, RoadmapColumn>();
  const columns: RoadmapColumn[] = [];
  sequence.scenarios.forEach((scenario, index) => {
    const bandLabel = bands[index] ?? sequence.fyStart;
    const yearMatch = bandLabel.match(/FY\d{2}/i);
    const columnLabel = yearMatch ? yearMatch[0].toUpperCase() : bandLabel;
    let column = columnMap.get(columnLabel);
    if (!column) {
      column = { id: `${columnLabel}-${columns.length}`, label: columnLabel, lanes: [], items: [] };
      columnMap.set(columnLabel, column);
      columns.push(column);
    }
    const stage = stageMap.get(scenario.id);
    const laneKeyBase = stage?.waveId ?? bandLabel;
    const laneKey = `${column.id}-${slugify(laneKeyBase)}`;
    let lane = column.lanes.find((entry) => entry.id === laneKey);
    if (!lane) {
      lane = {
        id: laneKey,
        label: formatLaneLabel(stage?.waveId, stage?.waveLabel ?? bandLabel),
        waveId: laneKeyBase,
        items: [],
      };
      column.lanes.push(lane);
    }
    const item: RoadmapStageItem = { scenario, waveLabel: stage?.waveLabel ?? bandLabel, stage };
    lane.items.push(item);
    column.items.push(item);
  });
  return columns;
}

function computeRoadmapMetrics(
  sequence: ModernizationSequence | null,
  columns: RoadmapColumn[],
  riskPostureScore = DEFAULT_RISK_POSTURE.score,
): { metrics: RoadmapColumnMetrics[]; breakEvenColumnId: string | null } | null {
  if (!sequence || !columns.length) return null;
  const metrics: RoadmapColumnMetrics[] = [];
  let cumulativeCost = 0;
  let cumulativeBenefit = 0;
  let breakEvenColumnId: string | null = null;
  columns.forEach((column) => {
    let columnCost = 0;
    let columnBenefit = 0;
    let roiPercent = 0;
    let readinessSum = 0;
    let riskSum = 0;
    let integrationCost = 0;
    column.items.forEach(({ scenario }) => {
      const fin = resolveScenarioFinancials(sequence, scenario);
      const stageTcc = Math.abs(sequence.tccTarget + fin.tccDelta);
      const stageRoi = Math.max(0, sequence.roiTarget + fin.roiDelta);
      const stageBenefit = stageTcc * (stageRoi / 100);
      const burden = resolveIntegrationBurden(scenario, sequence, riskPostureScore);
      columnCost += stageTcc;
      columnBenefit += stageBenefit;
      roiPercent += stageRoi;
      readinessSum += scenario.readiness;
      riskSum += scenario.riskScore;
      integrationCost += burden.cost;
    });
    cumulativeCost += columnCost;
    cumulativeBenefit += columnBenefit;
    if (!breakEvenColumnId && cumulativeBenefit >= cumulativeCost) {
      breakEvenColumnId = column.id;
    }
    metrics.push({
      columnId: column.id,
      totalTcc: columnCost,
      roiPercent,
      benefitValue: columnBenefit,
      readinessAvg: column.items.length ? readinessSum / column.items.length : 0,
      riskAvg: column.items.length ? riskSum / column.items.length : 0,
      cumulativeCost,
      cumulativeBenefit,
      integrationCost,
    });
  });
  return { metrics, breakEvenColumnId };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "lane";
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function getWaveKey(waveId?: string, label?: string): string {
  if (waveId) return slugify(waveId);
  if (label) return slugify(label);
  return "wave";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function detectStageSignals(stage?: StageWithTimeline): { hasHeavyChange: boolean; hasDualRun: boolean } {
  if (!stage) return { hasHeavyChange: false, hasDualRun: false };
  const haystack = `${stage.title ?? ""} ${stage.notes ?? ""}`.toLowerCase();
  const hasHeavyChange = CHANGE_KEYWORDS.some((keyword) => haystack.includes(keyword));
  const hasDualRun = DUAL_RUN_KEYWORDS.some((keyword) => haystack.includes(keyword));
  return { hasHeavyChange, hasDualRun };
}

function scoreWaveCollision(stageA: StageWithTimeline, stageB: StageWithTimeline, collision: Collision): number {
  let score = 0;
  score += collision.sharedSystems.length * 30;
  score += collision.sharedIntegrations.length * 20;
  if (collision.sharedDomains.length) score += 10;
  const signalsA = detectStageSignals(stageA);
  const signalsB = detectStageSignals(stageB);
  if (signalsA.hasHeavyChange || signalsB.hasHeavyChange) score += 25;
  if (signalsA.hasDualRun || signalsB.hasDualRun) score += 15;
  if (collision.severity === "high") score += 15;
  else if (collision.severity === "medium") score += 5;
  return Math.min(WAVE_PRESSURE_MAX, score);
}

function computeWavePressureMatrix(stageMap: Map<string, StageWithTimeline>, report: CollisionReport | null): WavePressureMatrix {
  const matrix: WavePressureMatrix = new Map();
  if (!report) return matrix;
  const waveLabelMap = new Map<string, string>();
  stageMap.forEach((stage) => {
    const key = getWaveKey(stage.waveId, stage.waveLabel);
    if (!waveLabelMap.has(key)) {
      waveLabelMap.set(key, stage.waveLabel ?? formatLaneLabel(stage.waveId, stage.waveLabel));
    }
  });
  type PairAccumulator = {
    aKey: string;
    bKey: string;
    score: number;
    sharedSystems: Set<string>;
    sharedIntegrations: Set<string>;
    sharedDomains: Set<string>;
    overlapWindows: Set<string>;
    highestSeverity: CollisionSeverity | null;
  };
  const pairScores = new Map<string, PairAccumulator>();
  report.collisions.forEach((collision) => {
    const stageA = stageMap.get(collision.aStageId);
    const stageB = stageMap.get(collision.bStageId);
    if (!stageA || !stageB) return;
    const aKey = getWaveKey(stageA.waveId, stageA.waveLabel);
    const bKey = getWaveKey(stageB.waveId, stageB.waveLabel);
    if (aKey === bKey) return;
    const increment = scoreWaveCollision(stageA, stageB, collision);
    if (!increment) return;
    const pairKey = [aKey, bKey].sort().join("__");
    let bucket = pairScores.get(pairKey);
    if (!bucket) {
      bucket = {
        aKey,
        bKey,
        score: 0,
        sharedSystems: new Set<string>(),
        sharedIntegrations: new Set<string>(),
        sharedDomains: new Set<string>(),
        overlapWindows: new Set<string>(),
        highestSeverity: null,
      };
      pairScores.set(pairKey, bucket);
    }
    bucket.score = Math.min(WAVE_PRESSURE_MAX, bucket.score + increment);
    collision.sharedSystems.forEach((system) => bucket!.sharedSystems.add(system));
    collision.sharedIntegrations.forEach((integration) => bucket!.sharedIntegrations.add(integration));
    collision.sharedDomains.forEach((domain) => bucket!.sharedDomains.add(domain));
    bucket.overlapWindows.add(`${collision.overlap.fyStart} → ${collision.overlap.fyEnd}`);
    if (!bucket.highestSeverity || SEVERITY_ORDER[collision.severity] > SEVERITY_ORDER[bucket.highestSeverity]) {
      bucket.highestSeverity = collision.severity;
    }
  });

  const ensureEntry = (waveKey: string): WavePressureEntry => {
    const existing = matrix.get(waveKey);
    if (existing) return existing;
    const entry: WavePressureEntry = {
      waveId: waveKey,
      label: waveLabelMap.get(waveKey) ?? waveKey,
      score: 0,
      partners: [],
    };
    matrix.set(waveKey, entry);
    return entry;
  };

  pairScores.forEach((pair) => {
    if (!pair.score) return;
    const sharedSystems = Array.from(pair.sharedSystems);
    const sharedIntegrations = Array.from(pair.sharedIntegrations);
    const sharedDomains = Array.from(pair.sharedDomains);
    const overlapWindows = Array.from(pair.overlapWindows);

    const entryA = ensureEntry(pair.aKey);
    const entryB = ensureEntry(pair.bKey);
    const partnerForA: WavePressurePartner = {
      waveId: pair.bKey,
      label: waveLabelMap.get(pair.bKey) ?? pair.bKey,
      score: pair.score,
      sharedSystems,
      sharedIntegrations,
      sharedDomains,
      highestSeverity: pair.highestSeverity ?? undefined,
      overlapWindows,
    };
    const partnerForB: WavePressurePartner = {
      waveId: pair.aKey,
      label: waveLabelMap.get(pair.aKey) ?? pair.aKey,
      score: pair.score,
      sharedSystems,
      sharedIntegrations,
      sharedDomains,
      highestSeverity: pair.highestSeverity ?? undefined,
      overlapWindows,
    };
    entryA.partners.push(partnerForA);
    entryB.partners.push(partnerForB);
    entryA.score = Math.max(entryA.score, pair.score);
    entryB.score = Math.max(entryB.score, pair.score);
  });

  return matrix;
}

function computeRiskPosture(decisions: ConflictDecisionEvent[]): RiskPosture {
  if (!decisions.length) return DEFAULT_RISK_POSTURE;
  const now = Date.now();
  const windowMs = DEFAULT_RISK_POSTURE.window_days * 24 * 60 * 60 * 1000;
  const recent = decisions.filter((event) => {
    const ts = Date.parse(event.timestamp);
    return Number.isFinite(ts) && now - ts <= windowMs;
  });
  const dataset = recent.length ? recent : decisions;
  const n = dataset.length;
  const acceptanceRate = dataset.filter((event) => event.selected_disposition === "accept").length / n;
  const downshiftRate = dataset.filter((event) => event.severity_adjustment < 0).length / n;
  const evidenceRate = dataset.filter((event) => event.evidence_attached !== "none").length / n;
  const aggressionRate = dataset.filter((event) => event.selected_disposition === "accept" || event.severity_adjustment > 0).length / n;
  const score = clamp01(0.35 * acceptanceRate + 0.25 * downshiftRate + 0.2 * (1 - evidenceRate) + 0.2 * aggressionRate);
  const volumeConfidence = clamp01(Math.log1p(n) / Math.log1p(50));
  const recencyBoost = clamp01(dataset.length / 10);
  const confidence = clamp01(volumeConfidence * (recent.length ? 0.75 + 0.25 * recencyBoost : 0.5));
  const band: RiskPosture["band"] = score <= 0.33 ? "Guarded" : score < 0.67 ? "Balanced" : "Aggressive";
  return {
    score,
    band,
    confidence,
    last_updated: dataset[dataset.length - 1]?.timestamp ?? new Date().toISOString(),
    n_events: n,
    window_days: DEFAULT_RISK_POSTURE.window_days,
  };
}

const SEVERITY_NUMERIC: Record<CollisionSeverity, number> = { low: 1, medium: 2, high: 3 };

function calibrateSeverityByRiskPosture(severity: CollisionSeverity | null, riskPostureScore: number): CollisionSeverity | null {
  if (!severity) return null;
  const base = SEVERITY_NUMERIC[severity] ?? 1;
  const multiplier = 0.85 + 0.3 * clamp01(riskPostureScore);
  const calibrated = base * multiplier;
  if (calibrated >= 2.6) return "high";
  if (calibrated >= 1.6) return "medium";
  return "low";
}

function formatLaneLabel(waveId?: string, fallbackLabel?: string): string {
  if (waveId) {
    return waveId
      .split(/[-_]/g)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }
  if (fallbackLabel) return fallbackLabel;
  return "Wave";
}

function formatStageWindow(stage?: StageWithTimeline): string | null {
  if (!stage) return null;
  const start = formatFiscalMonth(stage.startIndex);
  const end = formatFiscalMonth(stage.endIndex);
  return `${start} → ${end}`;
}

type ConflictInspectorDrawerProps = {
  open: boolean;
  stageId: string | null;
  stageMap: Map<string, StageWithTimeline>;
  report: CollisionReport | null;
  onClose: () => void;
  onJump?: (stageId: string, linkedStageIds?: string[]) => void;
  onReview?: (stageId: string, collision: Collision) => void;
  riskPostureScore: number;
};

function ConflictInspectorDrawer({ open, stageId, stageMap, report, onClose, onJump, onReview, riskPostureScore }: ConflictInspectorDrawerProps) {
  if (!open || !stageId) return null;
  const stage = stageMap.get(stageId);
  const collisions = stage && report ? report.collisionsByStageId?.[stage.stageId] ?? [] : [];
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="flex-1 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-h-[85vh] rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Conflict inspector</p>
            {stage ? (
              <p className="text-xs text-slate-500">
                {stage.title} · {stage.waveLabel}
              </p>
            ) : (
              <p className="text-xs text-slate-500">Select a stage to inspect overlaps.</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-4 text-sm text-slate-700">
          {!stage ? (
            <p className="text-xs text-slate-500">No stage selected.</p>
          ) : !report ? (
            <p className="text-xs text-slate-500">Collision detection requires harmonized stage metadata.</p>
          ) : collisions.length ? (
            <div className="space-y-4">
              {collisions.map((collision) => {
                const targetStageId = collision.aStageId === stage.stageId ? collision.bStageId : collision.aStageId;
                const targetStage = stageMap.get(targetStageId);
                const reasonText = describeCollisionRules(collision.qualificationRules);
                const severity = getSeverityLabel(calibrateSeverityByRiskPosture(collision.severity, riskPostureScore));
                return (
                  <section key={`${collision.aStageId}-${collision.bStageId}-${collision.overlap.fyStart}-${collision.overlap.fyEnd}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
                    <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500">Parallel stage</p>
                    <p className="text-sm font-semibold text-slate-900">{targetStage?.title ?? targetStageId}</p>
                    <p className="text-[0.65rem] text-slate-500">{targetStage?.waveLabel ?? "Parallel wave"}</p>
                    <p className="mt-2 text-[0.65rem] text-slate-600">
                      Severity · {severity ?? "Tracked"} · Overlap {collision.overlap.fyStart} → {collision.overlap.fyEnd}
                    </p>
                    {reasonText ? <p className="mt-1 text-[0.65rem] text-slate-600">Why: {reasonText}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-slate-600">
                      {collision.sharedSystems.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{collision.sharedSystems.length} shared systems</span>
                      ) : null}
                      {collision.sharedIntegrations.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{collision.sharedIntegrations.length} shared integrations</span>
                      ) : null}
                      {collision.sharedDomains.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{collision.sharedDomains.length} shared domains</span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onJump ? (
                        <Button variant="secondary" size="sm" onClick={() => onJump(targetStageId)}>
                          Jump to stage
                        </Button>
                      ) : null}
                      {onReview ? (
                        <Button variant="default" size="sm" onClick={() => onReview(stage.stageId, collision)}>
                          Adjust severity
                        </Button>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No parallel conflicts detected for this stage.</p>
          )}
        </div>
      </div>
    </div>
  );
}

type WavePressureDrawerProps = {
  open: boolean;
  waveId: string | null;
  matrix: WavePressureMatrix;
  onClose: () => void;
};

function WavePressureDrawer({ open, waveId, matrix, onClose }: WavePressureDrawerProps) {
  if (!open || !waveId) return null;
  const entry = matrix.get(waveId);
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div className="flex-1 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-h-[80vh] rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl sm:mx-auto sm:max-w-3xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Shared-change pressure</p>
            <p className="text-xs text-slate-500">{entry ? entry.label : "No wave selected"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 text-sm text-slate-700">
          {!entry ? (
            <p className="text-xs text-slate-500">No overlapping waves recorded for this lane.</p>
          ) : entry.partners.length === 0 ? (
            <p className="text-xs text-slate-500">No measurable shared-change pressure detected.</p>
          ) : (
            <div className="space-y-4">
              {entry.partners
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((partner) => (
                  <section key={`${entry.waveId}-${partner.waveId}`} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs">
                    <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-500">Overlaps with</p>
                    <p className="text-sm font-semibold text-slate-900">{partner.label}</p>
                    <p className="text-[0.65rem] text-slate-500">
                      Pressure score · {Math.round(partner.score)}
                      {partner.highestSeverity ? ` · Conflicts ${getSeverityLabel(partner.highestSeverity)}` : null}
                    </p>
                    {partner.overlapWindows.length ? (
                      <p className="mt-1 text-[0.65rem] text-slate-500">Overlap window: {partner.overlapWindows.join(", ")}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] text-slate-600">
                      {partner.sharedSystems.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{partner.sharedSystems.length} shared systems</span>
                      ) : null}
                      {partner.sharedIntegrations.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{partner.sharedIntegrations.length} shared integrations</span>
                      ) : null}
                      {partner.sharedDomains.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-700">{partner.sharedDomains.length} shared domains</span>
                      ) : null}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StageJumpListCardProps = {
  sequence: GraphSequencerItem[];
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  activePhase: string;
  onSimulate: (phase: string) => void;
  highlightStageId: string | null;
};

function StageJumpListCard({
  sequence,
  onDragStart,
  onDragOver,
  onDragEnd,
  activePhase,
  onSimulate,
  highlightStageId,
}: StageJumpListCardProps) {
  return (
    <GraphSequencerPanel
      sequence={sequence}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      activePhase={activePhase}
      onSimulate={onSimulate}
      highlightSequenceId={highlightStageId}
    />
  );
}

type IntentStatus = "idle" | "working" | "success" | "error";

type ApplyIntentCardProps = {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  status: IntentStatus;
  error?: string | null;
};

function ApplyIntentCard({ value, onChange, onSubmit, status, error }: ApplyIntentCardProps) {
  const disabled = status === "working";
  return (
    <Card className="rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-700">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Apply intent</p>
          <p className="text-xs text-slate-500">Send a quick instruction to reprioritize the sequence.</p>
        </div>
        <textarea
          className="h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
          placeholder="e.g. Shift OMS modernization to EMEA Q1..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
        <div className="pt-1 text-right">
          <Button onClick={onSubmit} disabled={disabled || !value.trim()}>
            {disabled ? "Applying..." : "Update Sequence"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

type StageDetailCardProps = {
  stageId: string | null;
  stageMap: Map<string, StageWithTimeline>;
  scenarioIndex: Map<string, ModernizationScenario>;
  awarenessMap: Map<string, StageAwareness>;
  regionScopeByStageId: Map<string, string[]>;
  intentTagsByStageId: Map<string, string[]>;
  collisionReport: CollisionReport | null;
  riskPostureScore: number;
  showStoreCoverage: boolean;
};

function StageDetailCard({
  stageId,
  stageMap,
  scenarioIndex,
  awarenessMap,
  regionScopeByStageId,
  intentTagsByStageId,
  collisionReport,
  riskPostureScore,
  showStoreCoverage,
}: StageDetailCardProps) {
  const stage = stageId ? stageMap.get(stageId) : null;
  const scenario = stageId ? scenarioIndex.get(stageId) : null;
  const awareness = stageId ? awarenessMap.get(stageId) : null;
  const regions = stageId ? regionScopeByStageId.get(stageId) ?? [] : [];
  const intentTags = stageId ? intentTagsByStageId.get(stageId) ?? [] : [];
  const stageConflicts = stageId ? collisionReport?.collisionsByStageId?.[stageId] ?? [] : [];

  const orderedStageConflicts = stageConflicts.length
    ? [...stageConflicts].sort((a, b) => (SEVERITY_SUMMARY_ORDER[b.severity] ?? 0) - (SEVERITY_SUMMARY_ORDER[a.severity] ?? 0))
    : [];
  const primaryConflict = orderedStageConflicts[0];
  const calibratedSeverity = orderedStageConflicts.length
    ? calibrateSeverityByRiskPosture(primaryConflict.severity, riskPostureScore)
    : null;
  const conflictSummary = stageConflicts.length ? `${stageConflicts.length} overlapping waves${calibratedSeverity ? ` (${getSeverityLabel(calibratedSeverity)})` : ""}` : "None detected";
  const conflictReasonText = primaryConflict?.qualificationRules?.length ? describeCollisionRules(primaryConflict.qualificationRules) : "";

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-700">
      <p className="text-sm font-semibold text-slate-900">Stage details</p>
      {!stage ? (
        <p className="mt-2 text-xs text-slate-500">Select a stage to inspect touched systems, integrations, and footprint.</p>
      ) : (
        <div className="mt-3 space-y-3 text-xs text-slate-600">
          <div>
            <p className="text-sm font-semibold text-slate-900">{stage.title}</p>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">{stage.waveLabel}</p>
            {formatStageWindow(stage) ? <p className="text-[0.65rem] text-slate-500">{formatStageWindow(stage)}</p> : null}
          </div>
          <StageDetailRow label="Systems touched" value={`${stage.systemsTouched?.length ?? 0}`} />
          <StageDetailRow label="Integrations touched" value={`${stage.integrationsTouched?.length ?? 0}`} />
          {scenario?.countries?.length || regions.length ? (
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Footprint</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(regions.length ? regions : scenario?.countries ?? []).map((region) => (
                  <span key={`${stage.stageId}-${region}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-semibold text-slate-700">
                    {region}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {awareness ? (
            <div className="grid gap-2 text-[0.65rem] text-slate-600 sm:grid-cols-2">
              <StageDetailRow label="Blast radius" value={`${awareness.blastRadius.dependencyLoad} systems`} />
              {showStoreCoverage ? <StageDetailRow label="Store impact" value={`${awareness.storeFootprint.storesCount} stores`} /> : null}
              <StageDetailRow label="Confidence" value={`${Math.round(awareness.confidence.overall * 100)}%`} />
              <StageDetailRow label="Risk flags" value={awareness.riskFlags.length ? awareness.riskFlags.join(", ") : "None"} />
            </div>
          ) : null}
          {intentTags.length ? (
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400">ALE signals</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {intentTags.map((tag) => (
                  <span key={`${stage.stageId}-${tag}`} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.6rem] font-semibold text-indigo-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <StageDetailRow label="Conflicts" value={conflictSummary} />
          {conflictReasonText ? <p className="text-[0.65rem] text-slate-500">Why: {conflictReasonText}</p> : null}
        </div>
      )}
    </Card>
  );
}

function StageDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[0.65rem] text-slate-600">
      <span className="uppercase tracking-[0.3em] text-slate-400">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

type TargetsPanelProps = {
  targets: Targets | null;
  form: TargetFormState;
  onFieldChange: (field: keyof TargetFormState, value: string | boolean) => void;
  onSubmit: () => void;
};

function TargetsPanel({ targets, form, onFieldChange, onSubmit }: TargetsPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  const formatDateLabel = (value: string) => {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value;
    return new Date(parsed).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const scopePreview = [
    form.regions ? `Regions ${form.regions}` : null,
    form.brands ? `Brands ${form.brands}` : null,
    form.channels ? `Channels ${form.channels}` : null,
  ].filter(Boolean);
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">
      <p className="font-semibold uppercase tracking-[0.35em] text-slate-500">Targets</p>
      {targets ? (
        <div className="mt-2 space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[0.65rem] text-slate-600">
          <p className="text-sm font-semibold text-slate-900">{targets.goal}</p>
          <p className="text-slate-500">
            Deadline · {targets.deadline.type === "FY" ? targets.deadline.value : new Date(targets.deadline.value).toLocaleDateString()}
          </p>
          {targets.scope?.regions?.length ? <p>Regions · {targets.scope.regions.join(", ")}</p> : null}
          {targets.scope?.brands?.length ? <p>Brands · {targets.scope.brands.join(", ")}</p> : null}
          {targets.budget?.max ? (
            <p>
              Budget ≤ {targets.budget.max.toLocaleString(undefined, { maximumFractionDigits: 0 })} {targets.budget.currency}
            </p>
          ) : null}
          {targets.blackoutWindows?.length ? (
            <p>
              Blackout · {targets.blackoutWindows[0].label ?? "Holiday freeze"} (
              {formatDateLabel(targets.blackoutWindows[0].start)} – {formatDateLabel(targets.blackoutWindows[0].end)}
              {targets.blackoutWindows.length > 1 ? " +" + (targets.blackoutWindows.length - 1) + " more" : ""})
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[0.65rem] text-slate-500">Set a modernization goal and scope to run feasibility checks against the roadmap.</p>
      )}
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Goal</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            placeholder="e.g. Run Canada + Teva rollout in FY26"
            value={form.goal}
            onChange={(event) => onFieldChange("goal", event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Deadline type</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 px-2 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              value={form.deadlineType}
              onChange={(event) => onFieldChange("deadlineType", event.target.value as TargetFormState["deadlineType"])}
            >
              <option value="FY">Fiscal year</option>
              <option value="DATE">Exact date</option>
            </select>
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Deadline</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              value={form.deadlineValue}
              onChange={(event) => onFieldChange("deadlineValue", event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Regions</label>
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
            placeholder="CA, US"
            value={form.regions}
            onChange={(event) => onFieldChange("regions", event.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Brands</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              placeholder="Teva"
              value={form.brands}
              onChange={(event) => onFieldChange("brands", event.target.value)}
            />
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Channels</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              placeholder="B2B,B2C"
              value={form.channels}
              onChange={(event) => onFieldChange("channels", event.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Budget cap</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              placeholder="115000000"
              value={form.budgetMax}
              onChange={(event) => onFieldChange("budgetMax", event.target.value)}
            />
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Currency</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
              value={form.currency}
              onChange={(event) => onFieldChange("currency", event.target.value)}
            />
          </div>
        </div>
        {scopePreview.length ? <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">{scopePreview.join(" · ")}</p> : null}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[0.65rem] text-slate-600">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={form.includeHolidayBlackout}
              onChange={(event) => onFieldChange("includeHolidayBlackout", event.target.checked)}
            />
            Enforce holiday blackout (Nov 1 – Jan 15)
          </label>
          <p className="mt-1 text-[0.65rem] text-slate-500">
            Blocks production cutovers during peak retail season. Disable if your rollout isn&apos;t impacted.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={!form.goal.trim()}>
          Check feasibility
        </Button>
      </form>
    </Card>
  );
}

type FeasibilityBannerProps = {
  result: FeasibilityResult | null;
  onShowDetails: () => void;
};

function FeasibilityBanner({ result, onShowDetails }: FeasibilityBannerProps) {
  if (!result) return null;
  const topBlockers = result.blockers.slice(0, 2);
  const colorMap: Record<FeasibilityStatus, string> = {
    FEASIBLE: "border-emerald-200 bg-emerald-50 text-emerald-900",
    AT_RISK: "border-amber-200 bg-amber-50 text-amber-900",
    NOT_FEASIBLE: "border-rose-200 bg-rose-50 text-rose-900",
  };
  const labelMap: Record<FeasibilityStatus, string> = {
    FEASIBLE: "Feasible",
    AT_RISK: "At risk",
    NOT_FEASIBLE: "Not feasible",
  };
  return (
    <div className={clsx("mt-4 rounded-2xl border px-4 py-3 text-sm shadow-sm", colorMap[result.status])}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.3em]">{labelMap[result.status]}</p>
          <p className="text-xs opacity-80">Confidence {(result.confidence * 100).toFixed(0)}%</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onShowDetails}>
          View details
        </Button>
      </div>
      {topBlockers.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
          {topBlockers.map((blocker) => (
            <li key={blocker.code}>{blocker.summary}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs opacity-80">No blockers detected.</p>
      )}
    </div>
  );
}

type FeasibilityDetailsDrawerProps = {
  open: boolean;
  result: FeasibilityResult | null;
  targets: Targets | null;
  onClose: () => void;
};

function FeasibilityDetailsDrawer({ open, result, targets, onClose }: FeasibilityDetailsDrawerProps) {
  if (!open || !result || !targets) return null;
  const scopeParts = [
    targets.scope.regions.length ? `Regions: ${targets.scope.regions.join(", ")}` : null,
    targets.scope.brands?.length ? `Brands: ${targets.scope.brands.join(", ")}` : null,
    targets.scope.channels?.length ? `Channels: ${targets.scope.channels.join(", ")}` : null,
  ].filter(Boolean);
  const labelMap: Record<FeasibilityStatus, string> = {
    FEASIBLE: "Feasible",
    AT_RISK: "At risk",
    NOT_FEASIBLE: "Not feasible",
  };
  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{labelMap[result.status]}</p>
            <p className="text-xs text-slate-500">Confidence {(result.confidence * 100).toFixed(0)}%</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-slate-700">
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-slate-900">{targets.goal}</p>
            <p className="text-slate-500">Deadline · {formatDeadlineLabel(targets.deadline)}</p>
            {scopeParts.length ? <p className="text-slate-500">{scopeParts.join(" · ")}</p> : null}
            {targets.budget?.max ? (
              <p className="text-slate-500">
                Budget ≤ {targets.budget.max.toLocaleString(undefined, { maximumFractionDigits: 0 })} {targets.budget.currency}
              </p>
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {result.blockers.length ? (
              result.blockers.map((blocker) => (
                <div key={blocker.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                    {blocker.code.replaceAll("_", " ")} · Severity {blocker.severity}
                  </p>
                  <p className="mt-1 text-slate-800">{blocker.summary}</p>
                  {blocker.evidence?.estimate ? (
                    <p className="mt-1 text-[0.65rem] text-slate-500">
                      Needed {blocker.evidence.estimate.needed ?? "-"} vs available {blocker.evidence.estimate.available ?? "-"} {blocker.evidence.estimate.units ?? ""}
                    </p>
                  ) : null}
                  {blocker.suggestions?.length ? (
                    <ul className="mt-2 list-disc pl-4 text-[0.65rem] text-slate-600">
                      {blocker.suggestions.map((suggestion) => (
                        <li key={suggestion}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No blockers detected.</p>
            )}
          </div>
          {result.whatIf?.deadlinePlusMonths ? (
            <div className="mt-4">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">What-if deadline shifts</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {Object.entries(result.whatIf.deadlinePlusMonths).map(([offset, status]) => (
                  <span key={offset} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                    +{offset} mo → {status === "FEASIBLE" ? "Feasible" : status === "AT_RISK" ? "At risk" : "Not feasible"}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {result.minRequired ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">Minimum required</p>
              {result.minRequired.durationMonths ? <p>{result.minRequired.durationMonths} months of runway</p> : null}
              {typeof result.minRequired.budgetFloor === "number" ? <p>${result.minRequired.budgetFloor.toFixed(1)}M estimated floor</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type ScenarioHypothesis = {
  id: string;
  title: string;
  hypothesis?: string;
  linkedStageIds: string[];
  conflictCount: number;
  trackLabel?: string;
  regionLabel?: string;
};

type ScenarioHypothesisListProps = {
  items: ScenarioHypothesis[];
  activeScenarioId: string | null;
  onSelect: (scenarioId: string, linkedStageIds: string[]) => void;
};

function ScenarioHypothesisList({ items, activeScenarioId, onSelect }: ScenarioHypothesisListProps) {
  if (!items.length) {
    return (
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Scenarios</p>
        <p className="mt-2 text-xs text-slate-500">No scenario hypotheses available.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Scenarios</p>
      {items.map((scenario) => {
        const isActive = scenario.id === activeScenarioId;
        const brief = SCENARIO_BRIEFS[scenario.id];
        const name = brief?.name ?? scenario.title;
        const regionLabel = brief?.scope_region ?? scenario.regionLabel;
        const scopeParts = [regionLabel, brief?.scope_brand ? brief.scope_brand : null, brief?.scope_channels ? brief.scope_channels : null].filter(Boolean);
        const conflictCount = scenario.conflictCount ?? 0;
        const linkedStageCount = scenario.linkedStageIds?.length ?? scenario.stageCount ?? 0;
        return (
          <button
            key={scenario.id}
            type="button"
            onClick={() => onSelect(scenario.id, scenario.linkedStageIds)}
            className={clsx(
              "w-full rounded-2xl border px-3 py-3 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
              isActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-400",
            )}
          >
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            {scopeParts.length ? (
              <p className="mt-1 text-[0.65rem] font-semibold text-slate-600">{scopeParts.join(" · ")}</p>
            ) : null}
            {brief?.goal || scenario.hypothesis || scenario.description ? (
              <p className="mt-2 text-[0.7rem] text-slate-600" style={CLAMP_THREE_LINES}>
                {brief?.goal ?? scenario.hypothesis ?? scenario.description}
              </p>
            ) : null}
            {brief?.primaryRisk ? (
              <p className="mt-2 text-[0.65rem] text-slate-700">
                <span className="font-semibold text-slate-800">Primary risk:</span> {brief.primaryRisk}
              </p>
            ) : null}
            {brief?.decisionNeeded ? (
              <p className="mt-1 text-[0.65rem] text-slate-700">
                <span className="font-semibold text-slate-800">Decision:</span> {brief.decisionNeeded}
              </p>
            ) : null}
            {brief?.owner ? <p className="mt-1 text-[0.65rem] text-slate-500">Owner · {brief.owner}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-[0.6rem] text-slate-600">
              {linkedStageCount ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  {linkedStageCount} stage{linkedStageCount > 1 ? "s" : ""}
                </span>
              ) : null}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                {conflictCount ? `${conflictCount} conflicts` : "No conflicts"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ConflictSummaryCard({ summary, onInspect }: { summary: ConflictSummaryData; onInspect?: (stageId: string) => void }) {
  if (!summary.total) return null;
  const reasonText = summary.topStageRules?.length ? describeCollisionRules(summary.topStageRules) : null;
  const partnerLabel = summary.topStagePartner?.title;
  const overlapText =
    summary.topStageOverlap?.fyStart && summary.topStageOverlap?.fyEnd
      ? `${summary.topStageOverlap.fyStart} → ${summary.topStageOverlap.fyEnd}`
      : null;
  const severityLabel = summary.topStageSeverity ? getSeverityLabel(summary.topStageSeverity) : null;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.65rem] text-amber-800">
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-amber-600">
        Conflicts {summary.total} · H {summary.high} / M {summary.medium} / L {summary.low}
      </span>
      {summary.topStage ? (
        <span className="text-[0.65rem]">
          {summary.topStage.title}
          {severityLabel ? ` (${severityLabel})` : ""} · {partnerLabel ? `∥ ${partnerLabel}` : null}
          {overlapText ? ` · ${overlapText}` : null}
          {reasonText ? ` · ${reasonText}` : null}
        </span>
      ) : null}
      {summary.topStage && onInspect ? (
        <button
          type="button"
          onClick={() => onInspect(summary.topStage!.stageId)}
          className="inline-flex items-center rounded-full border border-amber-300 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-700 transition hover:bg-amber-50"
        >
          Inspect
        </button>
      ) : null}
    </div>
  );
}

type ConflictDecisionDrawerProps = {
  open: boolean;
  conflict: { stageId: string; collision: Collision } | null;
  stageMap: Map<string, StageWithTimeline>;
  onClose: () => void;
  onSubmit: (input: {
    stageId: string;
    conflict: Collision;
    disposition: ConflictDisposition;
    severityAdjustment: -2 | -1 | 0 | 1 | 2;
    confidence: number;
    evidence: EvidenceType;
    notes?: string;
  }) => void;
};

function ConflictDecisionDrawer({ open, conflict, stageMap, onClose, onSubmit }: ConflictDecisionDrawerProps) {
  const [disposition, setDisposition] = useState<ConflictDisposition>("mitigate");
  const [severityAdjustment, setSeverityAdjustment] = useState<-2 | -1 | 0 | 1 | 2>(0);
  const [confidence, setConfidence] = useState(0.5);
  const [evidence, setEvidence] = useState<EvidenceType>("none");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!conflict) return;
    setDisposition("mitigate");
    setSeverityAdjustment(0);
    setConfidence(0.5);
    setEvidence("none");
    setNotes("");
  }, [conflict]);

  if (!open || !conflict) return null;

  const stage = stageMap.get(conflict.stageId);
  const targetStageId = conflict.collision.aStageId === conflict.stageId ? conflict.collision.bStageId : conflict.collision.aStageId;
  const parallelStage = stageMap.get(targetStageId);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conflict) return;
    onSubmit({
      stageId: conflict.stageId,
      conflict: conflict.collision,
      disposition,
      severityAdjustment,
      confidence,
      evidence,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  };

  const sharedSystems = conflict.collision.sharedSystems;
  const sharedIntegrations = conflict.collision.sharedIntegrations;
  const sharedDomains = conflict.collision.sharedDomains;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-slate-900/30" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Conflict review</p>
            <p className="text-xs text-slate-500">{stage?.title ?? conflict.stageId}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Parallel wave</p>
          <p className="text-sm font-semibold text-slate-900">{parallelStage?.title ?? targetStageId}</p>
          <p className="text-xs text-slate-500">
            Overlap {conflict.collision.overlap.fyStart} → {conflict.collision.overlap.fyEnd}
          </p>
          {conflict.collision.qualificationRules.length ? (
            <p className="mt-2 text-xs text-slate-600">Why: {describeCollisionRules(conflict.collision.qualificationRules)}</p>
          ) : null}
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            {sharedSystems.length ? (
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">Shared systems</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {sharedSystems.map((system) => (
                    <li key={system}>{system}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sharedIntegrations.length ? (
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">Shared integrations</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {sharedIntegrations.map((integration) => (
                    <li key={integration}>{integration}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sharedDomains.length ? (
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">Shared domains</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {sharedDomains.map((domain) => (
                    <span key={domain} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-700">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <form className="mt-4 space-y-3 text-xs text-slate-600" onSubmit={handleSubmit}>
            <label className="block text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
              Disposition
              <select
                value={disposition}
                onChange={(event) => setDisposition(event.target.value as ConflictDisposition)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
              >
                <option value="accept">Accept as-is</option>
                <option value="mitigate">Mitigate</option>
                <option value="resequence">Resequence</option>
                <option value="split_wave">Split wave</option>
                <option value="defer">Defer</option>
              </select>
            </label>
            <label className="block text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
              Severity alignment
              <select
                value={severityAdjustment}
                onChange={(event) => setSeverityAdjustment(Number(event.target.value) as -2 | -1 | 0 | 1 | 2)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
              >
                <option value={0}>Matches warning</option>
                <option value={-1}>Slightly overstated</option>
                <option value={-2}>Significantly overstated</option>
                <option value={1}>Slightly understated</option>
                <option value={2}>Significantly understated</option>
              </select>
            </label>
            <label className="block text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
              Confidence ({Math.round(confidence * 100)}%)
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(confidence * 100)}
                onChange={(event) => setConfidence(Number(event.target.value) / 100)}
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
              Evidence
              <select
                value={evidence}
                onChange={(event) => setEvidence(event.target.value as EvidenceType)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
              >
                <option value="none">No attachment</option>
                <option value="note">Add note</option>
                <option value="link">Linked source</option>
                <option value="artifact">Artifact uploaded</option>
              </select>
            </label>
            <label className="block text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">
              Notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1 h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none"
                placeholder="Optional explanation…"
              />
            </label>
            <div className="pt-2">
              <Button type="submit" className="w-full">
                Submit decision
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

type TimelineStageCardProps = {
  scenario: ModernizationScenario;
  stage?: StageWithTimeline;
  waveLabel: string;
  isActive: boolean;
  isInspected: boolean;
  isFiltered: boolean;
  onScenarioSelect?: (scenarioId: string, linkedStageIds?: string[]) => void;
  regionScope: string[];
  collisionReport: CollisionReport | null;
  stageMap: Map<string, StageWithTimeline>;
  onInspectConflicts?: (stageId: string) => void;
  riskPostureScore: number;
  showReadiness: boolean;
  showConflictBadges: boolean;
  storeFootprint?: StageAwareness["storeFootprint"];
  stageFilters: StageFilters;
};

function TimelineStageCard({
  scenario,
  stage,
  waveLabel,
  isActive,
  isInspected,
  isFiltered,
  onScenarioSelect,
  regionScope,
  collisionReport,
  stageMap,
  onInspectConflicts,
  riskPostureScore,
  showReadiness,
  showConflictBadges,
  storeFootprint,
  stageFilters,
}: TimelineStageCardProps) {
  const stageKey = stage?.stageId ?? scenario.id;
  const readinessValue = Number.isFinite(scenario.readiness) ? Number(scenario.readiness) : 0;
  const readinessPercent = Math.round(Math.min(1, Math.max(0, readinessValue)) * 100);
  const brief = SCENARIO_BRIEFS[scenario.id];
  const scenarioGoal = brief?.goal ?? scenario.hypothesis ?? scenario.description;
  const stageConflicts = collisionReport?.collisionsByStageId?.[stageKey] ?? [];
  const calibratedSeverity = stageConflicts.length ? calibrateSeverityByRiskPosture(highestSeverity(stageConflicts), riskPostureScore) : null;
  const severityLabel = calibratedSeverity ? getSeverityLabel(calibratedSeverity) || "Tracked" : "";
  const waveSummary = summarizeWaveCollision(stage, stageConflicts, stageMap, riskPostureScore);
  const timeWindow = formatStageWindow(stage);
  const systemsCount = stage?.systemsTouched?.length ?? scenario.systemCount ?? 0;
  const integrationCount = stage?.integrationsTouched?.length ?? scenario.integrationCount ?? 0;
  const storeImpactCount = storeFootprint?.storesCount ?? 0;

  const passesConflictFilter = !stageFilters.conflictsOnly || stageConflicts.length > 0;
  const passesStoreFilter = !stageFilters.storeImpactOnly || storeImpactCount > 0;
  const passesReadinessFilter =
    stageFilters.readiness === "all"
      ? true
      : stageFilters.readiness === "under80"
      ? readinessPercent < 80
      : readinessPercent < 60;

  if (!passesConflictFilter || !passesStoreFilter || !passesReadinessFilter) {
    return null;
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onScenarioSelect?.(scenario.id, [stageKey])}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onScenarioSelect?.(scenario.id, [stageKey]);
        }
      }}
      className={clsx(
        "w-full cursor-pointer rounded-2xl border px-3 py-2 text-left text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
        isActive ? "border-indigo-500 bg-white shadow" : isInspected ? "border-indigo-200 bg-white" : "border-transparent bg-white/80 hover:border-indigo-200",
        isFiltered ? "opacity-35" : "opacity-100",
      )}
    >
      <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
      <div className="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
        <span className={clsx("rounded-full px-2 py-0.5 tracking-[0.15em]", getWaveColorClass(waveLabel))}>{waveLabel}</span>
        {timeWindow ? <span className="tracking-normal text-slate-500">{timeWindow}</span> : null}
      </div>
      {scenarioGoal ? (
        <p className="mt-1 text-[0.65rem] text-slate-600" style={CLAMP_TWO_LINES}>
          {scenarioGoal}
        </p>
      ) : null}
      {waveSummary ? (
        <p className="mt-1 text-[0.65rem] text-amber-600" style={CLAMP_TWO_LINES}>
          {waveSummary}
        </p>
      ) : null}
      {systemsCount || integrationCount ? (
        <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-slate-600">
          {systemsCount ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{systemsCount} systems</span> : null}
          {integrationCount ? <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{integrationCount} integrations</span> : null}
        </div>
      ) : null}
      {showReadiness ? (
        <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-slate-600">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Readiness {readinessPercent}%</span>
        </div>
      ) : null}
      {showConflictBadges && stageConflicts.length && !isFiltered ? (
        <span
          role="button"
          tabIndex={0}
          className="mt-2 inline-flex cursor-pointer select-none items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[0.65rem] font-semibold text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-200"
          onClick={(event) => {
            event.stopPropagation();
            onInspectConflicts?.(stageKey);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onInspectConflicts?.(stageKey);
            }
          }}
        >
          Conflicts · {stageConflicts.length} ({severityLabel})
        </span>
      ) : null}
    </article>
  );
}

function buildScenarioHypotheses(
  sequence: ModernizationSequence | null,
  stageMap: Map<string, StageWithTimeline>,
  report: CollisionReport | null,
): ScenarioHypothesis[] {
  if (!sequence) return [];
  const domainBuckets = new Map<
    string,
    {
      stageIds: string[];
      regions: Set<string>;
    }
  >();
  sequence.scenarios.forEach((scenario) => {
    const linkedStageIds = (scenario.linkedStageIds?.length ? scenario.linkedStageIds : [scenario.id]).filter((id) => stageMap.has(id));
    if (!linkedStageIds.length) return;
    const stageDomains = linkedStageIds
      .map((id) => stageMap.get(id))
      .filter((entry): entry is StageWithTimeline => Boolean(entry))
      .flatMap((entry) => entry.domainsTouched ?? []);
    const domains = stageDomains.length ? stageDomains : sequence.domains.slice(0, 1);
    const regions = inferCountriesForScenario(scenario);
    domains.forEach((domain) => {
      if (!domain) return;
      const bucket = domainBuckets.get(domain) ?? { stageIds: [], regions: new Set<string>() };
      linkedStageIds.forEach((stageId) => bucket.stageIds.push(stageId));
      regions.forEach((region) => bucket.regions.add(region));
      domainBuckets.set(domain, bucket);
    });
  });
  const hypotheses = Array.from(domainBuckets.entries())
    .map(([domain, bucket]) => {
      const linkedStageIds = Array.from(new Set(bucket.stageIds));
      if (!linkedStageIds.length) return null;
      return {
        id: `scenario-${slugify(domain)}`,
        title: simplifyScenarioTitle(`${domain} modernization track`),
        hypothesis: `Keep ${domain.toLowerCase()} modernization synchronized while parallel lanes overlap.`,
        linkedStageIds,
        conflictCount: linkedStageIds.reduce((sum, stageId) => sum + (report?.collisionsByStageId?.[stageId]?.length ?? 0), 0),
        trackLabel: domain,
        regionLabel: bucket.regions.size ? Array.from(bucket.regions).join(" · ") : undefined,
      };
    })
    .filter((entry): entry is ScenarioHypothesis => Boolean(entry));
  hypotheses.sort((a, b) => b.linkedStageIds.length - a.linkedStageIds.length);
  if (hypotheses.length >= 2) {
    return limitScenarioHypotheses(hypotheses);
  }
  const fallback = sequence.scenarios
    .map((scenario) => convertScenarioToHypothesis(scenario, stageMap, report))
    .filter((scenario) => scenario.linkedStageIds.length);
  return limitScenarioHypotheses(fallback);
}

function convertScenarioToHypothesis(
  scenario: ModernizationScenario,
  stageMap: Map<string, StageWithTimeline>,
  report: CollisionReport | null,
): ScenarioHypothesis {
  const linkedStageIds = (scenario.linkedStageIds?.length ? scenario.linkedStageIds : [scenario.id]).filter((id) => stageMap.has(id));
  const trackLabel = deriveTrackLabel(linkedStageIds, stageMap);
  const regionLabel = buildScenarioRegionLabel(scenario);
  return {
    id: scenario.id,
    title: simplifyScenarioTitle(scenario.title),
    hypothesis: scenario.hypothesis ?? scenario.description,
    linkedStageIds,
    conflictCount: linkedStageIds.reduce((sum, stageId) => sum + (report?.collisionsByStageId?.[stageId]?.length ?? 0), 0),
    trackLabel,
    regionLabel,
  };
}

function simplifyScenarioTitle(title: string): string {
  const stripped = title.replace(/modernization\s+track/gi, "").trim();
  return stripped.length ? stripped : title;
}

function deriveTrackLabel(linkedStageIds: string[], stageMap: Map<string, StageWithTimeline>): string | undefined {
  for (const stageId of linkedStageIds) {
    const stage = stageMap.get(stageId);
    if (stage?.domainsTouched?.length) {
      return stage.domainsTouched[0];
    }
  }
  return undefined;
}

function buildScenarioRegionLabel(scenario: ModernizationScenario): string | undefined {
  const regions = inferCountriesForScenario(scenario);
  if (!regions.length) return undefined;
  const unique = Array.from(new Set(regions));
  return unique.join(" · ");
}

function limitScenarioHypotheses(items: ScenarioHypothesis[]): ScenarioHypothesis[] {
  if (items.length <= 5) return items;
  const head = items.slice(0, 4);
  const remainder = items.slice(4);
  const remainderStageIds = remainder.flatMap((item) => item.linkedStageIds);
  const regionLabels = new Set<string>();
  remainder.forEach((item) => {
    if (item.regionLabel) {
      regionLabels.add(item.regionLabel);
    }
  });
  const aggregated: ScenarioHypothesis = {
    id: "scenario-supporting",
    title: "Supporting maneuvers",
    hypothesis: `Grouped ${remainder.length} supporting tracks to keep hypotheses concise.`,
    linkedStageIds: Array.from(new Set(remainderStageIds)),
    conflictCount: remainder.reduce((sum, scenario) => sum + scenario.conflictCount, 0),
    trackLabel: "Supporting",
    regionLabel: regionLabels.size ? Array.from(regionLabels).join(" · ") : undefined,
  };
  return [...head, aggregated];
}

function buildConflictSummary(
  report: CollisionReport | null,
  stageMap: Map<string, StageWithTimeline>,
  stageFilter?: Set<string>,
): ConflictSummaryData | null {
  if (!report || !report.collisions.length) return null;
  const relevantCollisions = stageFilter
    ? report.collisions.filter((collision) => stageFilter.has(collision.aStageId) || stageFilter.has(collision.bStageId))
    : report.collisions;
  if (!relevantCollisions.length) return null;
  const summary: ConflictSummaryData = {
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    topStage: undefined,
    topStageCount: 0,
    topStagePartner: undefined,
    topStageRules: undefined,
    topStageOverlap: undefined,
    topStageSeverity: undefined,
  };
  const stageCollisionMap = new Map<string, Collision[]>();
  const trackStageCollision = (stageId: string, collision: Collision) => {
    if (stageFilter && !stageFilter.has(stageId)) return;
    const bucket = stageCollisionMap.get(stageId);
    if (bucket) bucket.push(collision);
    else stageCollisionMap.set(stageId, [collision]);
  };
  relevantCollisions.forEach((collision) => {
    summary.total += 1;
    switch (collision.severity) {
      case "high":
        summary.high += 1;
        break;
      case "medium":
        summary.medium += 1;
        break;
      default:
        summary.low += 1;
    }
    trackStageCollision(collision.aStageId, collision);
    trackStageCollision(collision.bStageId, collision);
  });
  const topEntry = Array.from(stageCollisionMap.entries()).sort((a, b) => b[1].length - a[1].length)[0];
  if (topEntry) {
    const [topStageId, collisions] = topEntry;
    const stage = stageMap.get(topStageId);
    summary.topStage = stage;
    summary.topStageCount = collisions.length;
    const ordered = [...collisions].sort(
      (a, b) => (SEVERITY_SUMMARY_ORDER[b.severity] ?? 0) - (SEVERITY_SUMMARY_ORDER[a.severity] ?? 0),
    );
    const focus = ordered[0];
    if (focus) {
      const partnerStageId = focus.aStageId === topStageId ? focus.bStageId : focus.aStageId;
      summary.topStagePartner = stageMap.get(partnerStageId);
      summary.topStageRules = focus.qualificationRules;
      summary.topStageOverlap = focus.overlap;
      summary.topStageSeverity = focus.severity;
    }
  }
  return summary;
}

const SEVERITY_SUMMARY_ORDER: Record<CollisionSeverity, number> = { high: 3, medium: 2, low: 1 };

function summarizeWaveCollision(
  stage: StageWithTimeline | undefined,
  collisions: Collision[],
  stageMap: Map<string, StageWithTimeline>,
  riskPostureScore: number,
): string | null {
  if (!stage || !collisions.length) return null;
  const sorted = [...collisions].sort(
    (a, b) => (SEVERITY_SUMMARY_ORDER[b.severity] ?? 0) - (SEVERITY_SUMMARY_ORDER[a.severity] ?? 0),
  );
  const focus = sorted[0];
  const otherStageId = focus.aStageId === stage.stageId ? focus.bStageId : focus.aStageId;
  const otherStage = stageMap.get(otherStageId);
  if (!otherStage) return null;
  const systems = focus.sharedSystems.length;
  const integrations = focus.sharedIntegrations.length;
  const extras = sorted.length > 1 ? ` (+${sorted.length - 1} more)` : "";
  const severityLabel = getSeverityLabel(calibrateSeverityByRiskPosture(focus.severity, riskPostureScore));
  const severitySuffix = severityLabel ? ` (${severityLabel})` : "";
  return `Overlaps with ${otherStage.waveLabel} — ${systems} shared systems, ${integrations} shared integrations${extras}${severitySuffix}`;
}

function ArchitectureComponentList({
  items,
  expandedComponentId,
  onToggle,
  highlight,
  highlightTone = "default",
  autoExpandIntegrations = false,
}: {
  items: ArchitectureComponent[];
  expandedComponentId: string | null;
  onToggle: (componentId: string) => void;
  highlight?: { systems: Set<string>; integrations: Set<string> } | null;
  highlightTone?: "default" | "shared";
  autoExpandIntegrations?: boolean;
}) {
  if (!items.length) return null;
  const highlightSystems = highlight ? Array.from(highlight.systems) : [];
  const highlightIntegrations = highlight ? Array.from(highlight.integrations) : [];
  const matchesToken = (value: string, candidates: string[]) => {
    if (!value || !candidates.length) return false;
    return candidates.some((candidate) => {
      if (!candidate) return false;
      if (candidate === value) return true;
      if (candidate.length >= 4 && candidate.includes(value)) return true;
      if (value.length >= 4 && value.includes(candidate)) return true;
      return false;
    });
  };
  const highlightBorderClass = highlightTone === "shared" ? "border-rose-200 bg-rose-50/60" : "border-indigo-200 bg-indigo-50/60";
  const highlightTextClass = highlightTone === "shared" ? "text-rose-900" : "text-indigo-900";
  const highlightLinkClass = highlightTone === "shared" ? "text-rose-700" : "text-indigo-700";
  const highlightLinkBaseClass = highlightTone === "shared" ? "text-rose-600" : "text-indigo-600";
  const highlightChipClass = highlightTone === "shared" ? "bg-rose-100 text-rose-800" : "bg-indigo-100 text-indigo-800";
  const highlightIntegrationClass = highlightTone === "shared" ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700";
  return (
    <div className="mt-3 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-inner">
      <ul className="space-y-2">
        {items.map((component) => {
          const componentKey = normalizeToken(component.label);
          const subcomponentKeys = component.subcomponents?.map((sub) => normalizeToken(sub)) ?? [];
          const integrationKeys = component.integrations?.flatMap((integration) => [
            normalizeToken(integration.label),
            normalizeToken(integration.id),
          ]) ?? [];
          const isTouched =
            !!highlight &&
            (matchesToken(componentKey, highlightSystems) ||
              subcomponentKeys.some((sub) => matchesToken(sub, highlightSystems)) ||
              integrationKeys.some((integration) => matchesToken(integration, highlightIntegrations)));
          const hasTouchedIntegrations =
            !!highlight &&
            component.integrations?.some((integration) => {
              const key = normalizeToken(integration.label);
              const idKey = normalizeToken(integration.id);
              return matchesToken(key, highlightIntegrations) || matchesToken(idKey, highlightIntegrations);
            });
          const shouldExpandIntegrations =
            expandedComponentId === component.id || (autoExpandIntegrations && (isTouched || hasTouchedIntegrations));
          const dimInactive = !!highlight && !isTouched;
          return (
            <li
              key={component.id}
              className={clsx(
                "rounded-xl border border-transparent bg-white/60 px-3 py-2 transition",
                isTouched ? highlightBorderClass : "border-transparent",
                dimInactive ? "opacity-35" : "opacity-100",
              )}
            >
              {component.domain ? (
                <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">{component.domain}</p>
              ) : null}
            <div className="mt-1 flex items-center justify-between gap-2">
                <p className={clsx("text-sm font-semibold", isTouched ? highlightTextClass : "text-slate-900")}>{component.label}</p>
                {typeof component.integrationCount === "number" ? (
                  <button
                    type="button"
                    className={clsx(
                      "text-[0.65rem] font-semibold underline-offset-2 hover:underline",
                      hasTouchedIntegrations ? highlightLinkClass : highlightLinkBaseClass,
                    )}
                    onClick={() => onToggle(component.id)}
                  >
                    {component.integrationCount} integrations
                  </button>
                ) : null}
              </div>
              {component.subcomponents?.length ? (
                <div className="mt-2">
                  <p className="text-[0.55rem] uppercase tracking-[0.35em] text-slate-400">Modules</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {component.subcomponents.map((sub, idx) => (
                      <span
                        key={`${component.id}-sub-${idx}`}
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[0.6rem] font-medium",
                          highlight && matchesToken(normalizeToken(sub), highlightSystems)
                            ? highlightChipClass
                            : "bg-slate-100 text-slate-700",
                        )}
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            {shouldExpandIntegrations && component.integrations?.length ? (
                <ul className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-white/80 px-2 py-2 text-[0.65rem] text-slate-600">
                  {component.integrations.map((integration) => (
                    <li
                      key={integration.id}
                      className={clsx(
                        "flex items-center gap-2 rounded-lg px-1 py-0.5",
                        highlight &&
                          (matchesToken(normalizeToken(integration.label), highlightIntegrations) ||
                            matchesToken(normalizeToken(integration.id), highlightIntegrations))
                          ? highlightIntegrationClass
                          : "text-slate-600",
                      )}
                    >
                      <span className="text-slate-400">↳</span>
                      <span className="font-medium text-slate-900">{integration.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type StoreCoverage = {
  total: number;
  entries: StoreRecord[];
};

function StoreCoverageList({ coverage }: { coverage?: StoreCoverage }) {
  if (!coverage || !coverage.entries.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-white/60 bg-white/80 p-3 text-[0.65rem] text-slate-600">
      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Store footprint</p>
      <ul className="mt-2 space-y-1">
        {coverage.entries.map((entry) => (
          <li key={`${entry.country}-${entry.brand}`} className="flex items-center justify-between text-[0.7rem] text-slate-700">
            <span>
              {entry.country} · {entry.brand}
            </span>
            <span className="font-semibold text-slate-900">{entry.stores} stores</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 text-right text-[0.7rem] font-semibold text-slate-900">Total {coverage.total}</div>
    </div>
  );
}

function splitNodeLabel(raw: string): { base: string; child?: string } {
  const input = (raw ?? "").toString().trim();
  if (!input) return { base: "" };
  const separators = [" — ", " – ", " - ", "—", "–"];
  for (const separator of separators) {
    const idx = input.indexOf(separator);
    if (idx > 0) {
      const base = input.slice(0, idx).trim();
      const child = input.slice(idx + separator.length).trim();
      if (base && child) return { base, child };
      if (base) return { base };
    }
  }
  return { base: input };
}

function extractArchitectureComponents(graphData: LivingMapData | null): ArchitectureComponent[] {
  if (!graphData?.nodes || !Array.isArray(graphData.nodes)) return [];
  const edges = Array.isArray(graphData.edges) ? graphData.edges : [];
  const nodeLookup = new Map<string, { label: string }>();
  graphData.nodes.forEach((node: any) => {
    const nodeId = String(node.id ?? node.system_name ?? node.label ?? "");
    if (!nodeId) return;
    const label = String(node.label ?? node.system_name ?? nodeId);
    nodeLookup.set(nodeId, { label });
  });

  type Bucket = {
    id: string;
    label: string;
    domain?: string;
    state?: string;
    neighbors: Map<string, string>;
    subcomponents: Set<string>;
  };

  const buckets = new Map<string, Bucket>();

  graphData.nodes
    .filter((node: any) => node && typeof node === "object")
    .filter((node: any) => {
      const state = String(node.state ?? "").toLowerCase();
      const origins = Array.isArray(node.source_origin) ? node.source_origin.map((origin) => String(origin)) : [];
      return state === "added" || state === "future" || origins.includes("Future");
    })
    .forEach((node: any) => {
      const nodeId = String(node.id ?? node.system_name ?? node.label ?? Math.random().toString(36).slice(2));
      const rawLabel = String(node.label ?? node.system_name ?? node.id ?? "Unnamed component");
      const { base, child } = splitNodeLabel(rawLabel);
      const bucketKey = (base || rawLabel || nodeId).toLowerCase();
      let bucket = buckets.get(bucketKey);
      if (!bucket) {
        bucket = {
          id: nodeId,
          label: base || rawLabel,
          domain: node.domain ? String(node.domain) : undefined,
          state: node.state ? String(node.state) : undefined,
          neighbors: new Map(),
          subcomponents: new Set(),
        };
        buckets.set(bucketKey, bucket);
      } else {
        if (!bucket.domain && node.domain) bucket.domain = String(node.domain);
        if (!bucket.state && node.state) bucket.state = String(node.state);
      }
      const bucketRef = bucket!;
      if (child) bucketRef.subcomponents.add(child);
      if (Array.isArray(node.subcomponents)) {
        node.subcomponents
          .filter((sub: unknown) => typeof sub === "string" && sub.trim().length > 0)
          .forEach((sub: string) => bucketRef.subcomponents.add(sub.trim()));
      }

      const neighbors = new Set<string>();
      edges.forEach((edge: any) => {
        if (!edge || typeof edge !== "object") return;
        const source = String(edge.source ?? "");
        const target = String(edge.target ?? "");
        if (source === nodeId && target) neighbors.add(target);
        if (target === nodeId && source) neighbors.add(source);
      });
      neighbors.forEach((neighborId) => {
        if (!neighborId || neighborId === nodeId) return;
        const neighborLabel = nodeLookup.get(neighborId)?.label ?? neighborId;
        bucketRef.neighbors.set(neighborId, neighborLabel);
      });
    });

  return Array.from(buckets.values()).map((bucket) => {
    const integrations = Array.from(bucket.neighbors.entries()).map(([id, label]) => ({ id, label }));
    const subcomponents = Array.from(bucket.subcomponents);
    return {
      id: bucket.id,
      label: bucket.label,
      domain: bucket.domain,
      state: bucket.state,
      integrationCount: integrations.length,
      integrations,
      subcomponents: subcomponents.length ? subcomponents : undefined,
    };
  });
}

function allocateComponentsToColumns(
  sequence: ModernizationSequence | null,
  columns: RoadmapColumn[],
  components: ArchitectureComponent[],
): Map<string, ArchitectureComponent[]> {
  const allocation = new Map<string, ArchitectureComponent[]>();
  if (!components.length || !columns.length) return allocation;
  const domains = sequence?.domains ?? [];
  const pool = [...components];
  const chunkSize = Math.max(1, Math.ceil(components.length / columns.length));
  const matchesToken = (value: string, candidates: Set<string>) => {
    if (!value || !candidates.size) return false;
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (candidate === value) return true;
      if (candidate.length >= 4 && candidate.includes(value)) return true;
      if (value.length >= 4 && value.includes(candidate)) return true;
    }
    return false;
  };
  const matchesComponentToSystems = (component: ArchitectureComponent, systems: Set<string>) => {
    const componentKey = normalizeToken(component.label);
    if (matchesToken(componentKey, systems)) return true;
    if (component.subcomponents?.some((sub) => matchesToken(normalizeToken(sub), systems))) return true;
    if (component.integrations?.some((integration) => matchesToken(normalizeToken(integration.label), systems))) return true;
    return false;
  };
  columns.forEach((column, index) => {
    const touchedSystems = new Set<string>();
    column.items.forEach((item) => {
      item.stage?.systemsTouched?.forEach((system) => touchedSystems.add(normalizeToken(system)));
    });
    const touchedComponents = touchedSystems.size
      ? components.filter((component) => matchesComponentToSystems(component, touchedSystems))
      : [];
    const touchedIds = new Set(touchedComponents.map((component) => component.id));
    if (touchedIds.size) {
      for (let idx = pool.length - 1; idx >= 0; idx -= 1) {
        if (touchedIds.has(pool[idx].id)) {
          pool.splice(idx, 1);
        }
      }
    }
    const preferredDomain = domains.length ? domains[index % domains.length] : undefined;
    const chunk: ArchitectureComponent[] = [...touchedComponents];
    if (preferredDomain && chunk.length < chunkSize) {
      chunk.push(...takeComponentsFromPool(pool, preferredDomain, chunkSize - chunk.length));
    }
    while (chunk.length < chunkSize && pool.length) {
      chunk.push(pool.shift() as ArchitectureComponent);
    }
    allocation.set(column.id, chunk);
  });
  return allocation;
}

function takeComponentsFromPool(pool: ArchitectureComponent[], domain: string, count: number) {
  const chunk: ArchitectureComponent[] = [];
  const normalized = domain.toLowerCase();
  for (let idx = 0; idx < pool.length && chunk.length < count; idx += 1) {
    const candidate = pool[idx];
    if ((candidate.domain ?? "").toLowerCase() === normalized) {
      chunk.push(candidate);
      pool.splice(idx, 1);
      idx -= 1;
    }
  }
  return chunk;
}

function computeStoreCoverage(columns: RoadmapColumn[], storeRecords: StoreRecord[]) {
  const allocation = new Map<string, StoreCoverage>();
  if (!storeRecords.length || !columns.length) return allocation;
  columns.forEach((column) => {
    const countries = new Set<string>();
    column.items.forEach(({ scenario }) => {
      const inferred = inferCountriesForScenario(scenario);
      inferred.forEach((country) => countries.add(country));
    });
    if (!countries.size) return;
    const countryRecords = new Map<string, StoreRecord>();
    let total = 0;
    storeRecords.forEach((record) => {
      if (countries.has(record.country)) {
        const existing = countryRecords.get(record.country);
        if (existing) {
          existing.stores += record.stores;
        } else {
          countryRecords.set(record.country, { ...record });
        }
        total += record.stores;
      }
    });
    if (countryRecords.size) {
      allocation.set(column.id, { total, entries: Array.from(countryRecords.values()) });
    }
  });
  return allocation;
}

function inferCountriesForScenario(scenario: ModernizationScenario): string[] {
  if (scenario.countries?.length) return scenario.countries;
  const haystack = `${scenario.title} ${scenario.description}`.toLowerCase();
  const matches: string[] = [];
  if (haystack.includes("canada")) matches.push("CA");
  if (haystack.includes("us ") || haystack.includes("united states") || haystack.includes(" u.s")) matches.push("US");
  if (haystack.includes("uk")) matches.push("UK");
  if (haystack.includes("emea")) matches.push("UK");
  return matches.length ? Array.from(new Set(matches)) : [];
}

function collectUniqueCount(
  stageMap: Map<string, StageWithTimeline>,
  key: "systemsTouched" | "integrationsTouched",
): number {
  const set = new Set<string>();
  stageMap.forEach((stage) => {
    (stage[key] ?? []).forEach((item) => set.add(item));
  });
  return set.size;
}

const DEFAULT_INTEGRATION_COST_M = 0.18; // ~$180k per integration
const DEFAULT_STAGE_LABOR_COST_M = 1.5;
const BIG_BANG_SYSTEM_THRESHOLD = 10;

function evaluateFeasibility(
  targets: Targets,
  stageMap: Map<string, StageWithTimeline>,
  collisionReport: CollisionReport | null,
  scenarioIndex: Map<string, ModernizationScenario>,
  sequence: ModernizationSequence | null,
  riskPostureScore: number,
): FeasibilityResult {
  const blockers: FeasibilityBlocker[] = [];
  const stageList = Array.from(stageMap.values());
  if (!stageList.length) {
    return {
      status: "AT_RISK",
      confidence: 0.4,
      blockers: [
        {
          code: "CAPACITY_LIMIT",
          severity: 2,
          summary: "No stage metadata available to evaluate the timeline yet.",
          suggestions: ["Load a modernization sequence with detailed stages."],
        },
      ],
    };
  }
  const minStart = Math.min(...stageList.map((stage) => stage.startIndex));
  const maxEnd = Math.max(...stageList.map((stage) => stage.endIndex));
  const durationMonths = Math.max(0, maxEnd - minStart + 1);
  const deadlineIndex = resolveDeadlineIndex(targets.deadline);
  const completionLabel = formatFiscalMonth(maxEnd);
  if (deadlineIndex !== null && maxEnd > deadlineIndex) {
    const overrun = maxEnd - deadlineIndex;
    const severity: 1 | 2 | 3 = overrun > 18 ? 3 : overrun > 6 ? 2 : 1;
    blockers.push({
      code: "SCHEDULE_TOO_SHORT",
      severity,
      summary: `Roadmap needs until ${completionLabel}, which exceeds the target deadline by ${overrun} months.`,
      evidence: {
        relatedStageIds: [stageList.find((stage) => stage.endIndex === maxEnd)?.stageId ?? ""].filter(Boolean),
        window: { start: formatFiscalMonth(minStart), end: completionLabel },
      },
      suggestions: ["Extend the deadline", "De-scope regions or waves", "Allow more parallel execution headroom"],
    });
  }
  const uniqueIntegrations = collectUniqueCount(stageMap, "integrationsTouched");
  let estimatedBudgetMillions = stageList.length * DEFAULT_STAGE_LABOR_COST_M;
  stageList.forEach((stage) => {
    const scenario = scenarioIndex.get(stage.stageId);
    if (scenario) {
      const burden = resolveIntegrationBurden(scenario, sequence, riskPostureScore);
      estimatedBudgetMillions += burden.cost;
    } else {
      estimatedBudgetMillions += (stage.integrationsTouched?.length ?? 0) * DEFAULT_INTEGRATION_COST_M;
    }
  });
  const providedBudgetMillions = targets.budget?.max ? targets.budget.max / 1_000_000 : undefined;
  if (typeof providedBudgetMillions === "number" && estimatedBudgetMillions > providedBudgetMillions) {
    const overrun = estimatedBudgetMillions - providedBudgetMillions;
    const severity: 1 | 2 | 3 = overrun > providedBudgetMillions * 0.4 ? 3 : 2;
    blockers.push({
      code: "BUDGET_TOO_LOW",
      severity,
      summary: `Estimated delivery floor is ~$${estimatedBudgetMillions.toFixed(1)}M, above the declared cap of ~$${providedBudgetMillions.toFixed(1)}M.`,
      evidence: {
        estimate: { needed: Number(estimatedBudgetMillions.toFixed(1)), available: Number(providedBudgetMillions.toFixed(1)), units: "millions" },
      },
      suggestions: ["Increase budget ceiling", "Reduce regions or brands in scope", "Sequence fewer integrations per wave"],
    });
  }
  const collisions = collisionReport?.collisions ?? [];
  if (collisions.length) {
    const highCount = collisions.filter((collision) => collision.severity === "high").length;
    const severity: 1 | 2 | 3 = highCount > 1 ? 3 : highCount === 1 || collisions.length > 3 ? 2 : 1;
    blockers.push({
      code: "COLLISION_PRESSURE",
      severity,
      summary: `${collisions.length} overlapping waves share critical systems/integrations. ${highCount} of them are high severity.`,
      evidence: {
        relatedStageIds: collisions.slice(0, 3).flatMap((collision) => [collision.aStageId, collision.bStageId]),
        systems: collisions.flatMap((collision) => collision.sharedSystems).slice(0, 5),
        integrations: collisions.flatMap((collision) => collision.sharedIntegrations).slice(0, 5),
      },
      suggestions: ["Split conflicting stages into separate windows", "Allow a bridge pattern to reduce shared systems", "Adjust wave ordering"],
    });
  }
  if (targets.blackoutWindows?.length) {
    const blackoutConflicts = detectBlackoutConflicts(stageList, targets.blackoutWindows);
    if (blackoutConflicts.length) {
      blockers.push({
        code: "BLACKOUT_CONFLICT",
        severity: blackoutConflicts.length > 2 ? 3 : 2,
        summary: `${blackoutConflicts.length} stages overlap declared blackout windows.`,
        evidence: {
          relatedStageIds: blackoutConflicts.slice(0, 3).map((conflict) => conflict.stage.stageId),
          window: blackoutConflicts[0].window,
        },
        suggestions: ["Resequence impacted waves outside blackout", "Negotiate temporary freeze exception"],
      });
    }
  }
  if (targets.constraints?.maxDualRunMonths != null) {
    const dualRunViolations = stageList.filter((stage) => {
      const scenario = scenarioIndex.get(stage.stageId);
      return (scenario?.integrationBurden?.dualRun ?? 0) > targets.constraints!.maxDualRunMonths!;
    });
    if (dualRunViolations.length) {
      blockers.push({
        code: "CAPACITY_LIMIT",
        severity: dualRunViolations.length > 1 ? 3 : 2,
        summary: `${dualRunViolations.length} waves require dual-run longer than ${targets.constraints.maxDualRunMonths} months.`,
        evidence: { relatedStageIds: dualRunViolations.map((stage) => stage.stageId) },
        suggestions: ["Shorten dual-run overlap", "Introduce feature toggles to limit concurrent systems"],
      });
    }
  }
  if (targets.constraints?.requiredSystems?.length) {
    const missing = detectMissingSystems(stageList, targets.constraints.requiredSystems);
    if (missing.length) {
      blockers.push({
        code: "DEPENDENCY_GATE",
        severity: 2,
        summary: `Critical systems missing from plan: ${missing.join(", ")}.`,
        suggestions: ["Add modernization stage covering required systems", "Revise scope to include dependencies"],
      });
    }
  }
  if (targets.constraints?.noBigBang) {
    const bigBangStage = stageList.find(
      (stage) => (stage.systemsTouched?.length ?? scenarioIndex.get(stage.stageId)?.systemCount ?? 0) >= BIG_BANG_SYSTEM_THRESHOLD,
    );
    if (bigBangStage) {
      blockers.push({
        code: "CAPACITY_LIMIT",
        severity: 3,
        summary: `${bigBangStage.title} touches ${bigBangStage.systemsTouched?.length ?? 0} systems in one wave while "no big bang" is enabled.`,
        evidence: { relatedStageIds: [bigBangStage.stageId] },
        suggestions: ["Split the wave into smaller phases", "Sequence by domain instead of all-in"],
      });
    }
  }
  let status: FeasibilityStatus = "FEASIBLE";
  if (blockers.some((blocker) => blocker.severity === 3)) {
    status = "NOT_FEASIBLE";
  } else if (blockers.some((blocker) => blocker.severity >= 2)) {
    status = "AT_RISK";
  }
  const confidence = clamp01(0.9 - blockers.length * 0.15);
  const whatIf = computeDeadlineWhatIf(deadlineIndex, maxEnd, blockers);
  return {
    status,
    confidence,
    blockers,
    minRequired: {
      durationMonths,
      budgetFloor: Number(estimatedBudgetMillions.toFixed(2)),
    },
    whatIf,
  };
}

function detectBlackoutConflicts(
  stages: StageWithTimeline[],
  windows: { start: string; end: string; label?: string }[],
): Array<{ stage: StageWithTimeline; window: { start: string; end: string; label?: string } }> {
  const conflicts: Array<{ stage: StageWithTimeline; window: { start: string; end: string; label?: string } }> = [];
  windows.forEach((window) => {
    const startIndex = resolveLabelToIndex(window.start, false);
    const endIndex = resolveLabelToIndex(window.end, true);
    if (startIndex === null || endIndex === null) return;
    stages.forEach((stage) => {
      if (rangesOverlap(stage.startIndex, stage.endIndex, startIndex, endIndex)) {
        conflicts.push({ stage, window: { ...window, start: formatFiscalMonth(startIndex), end: formatFiscalMonth(endIndex) } });
      }
    });
  });
  return conflicts;
}

function detectMissingSystems(stages: StageWithTimeline[], required: string[]): string[] {
  const catalog = new Set<string>();
  stages.forEach((stage) => {
    (stage.systemsTouched ?? []).forEach((system) => catalog.add(system.toLowerCase()));
  });
  return required.filter((system) => !catalog.has(system.toLowerCase()));
}

function buildHolidayBlackoutWindows(stageMap: Map<string, StageWithTimeline>, deadlineValue: string): { start: string; end: string; label: string }[] {
  const indices = Array.from(stageMap.values()).flatMap((stage) => [stage.startIndex, stage.endIndex]);
  const startYear = indices.length ? Math.floor(Math.min(...indices) / 12) : deriveYearFromDeadline(deadlineValue) ?? new Date().getFullYear();
  let endYear = indices.length ? Math.floor(Math.max(...indices) / 12) : startYear + 1;
  if (endYear < startYear) {
    endYear = startYear + 1;
  }
  const windows: { start: string; end: string; label: string }[] = [];
  for (let year = startYear; year <= endYear + 1; year += 1) {
    windows.push({
      start: `${year}-11-01`,
      end: `${year + 1}-01-15`,
      label: "Peak holiday freeze",
    });
  }
  return windows;
}

function deriveYearFromDeadline(deadlineValue: string): number | null {
  if (!deadlineValue) return null;
  const fiscal = parseFiscalYear(deadlineValue);
  if (fiscal) {
    return fiscal < 100 ? 2000 + fiscal : fiscal;
  }
  const parsed = Date.parse(deadlineValue);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).getFullYear();
}

function computeDeadlineWhatIf(
  deadlineIndex: number | null,
  completionIndex: number,
  blockers: FeasibilityBlocker[],
): { deadlinePlusMonths?: Record<number, FeasibilityStatus> } | undefined {
  if (deadlineIndex === null) return undefined;
  const scheduleBlocker = blockers.find((blocker) => blocker.code === "SCHEDULE_TOO_SHORT");
  if (!scheduleBlocker) return undefined;
  const options = [6, 12, 24];
  const results: Record<number, FeasibilityStatus> = {};
  options.forEach((months) => {
    const extendedDeadline = deadlineIndex + months;
    const scheduleResolved = completionIndex <= extendedDeadline;
    const remainingBlockers = scheduleResolved ? blockers.filter((blocker) => blocker.code !== "SCHEDULE_TOO_SHORT") : blockers;
    let status: FeasibilityStatus = "FEASIBLE";
    if (remainingBlockers.some((blocker) => blocker.severity === 3)) {
      status = "NOT_FEASIBLE";
    } else if (remainingBlockers.some((blocker) => blocker.severity >= 2)) {
      status = "AT_RISK";
    }
    results[months] = status;
  });
  return { deadlinePlusMonths: results };
}

function resolveDeadlineIndex(deadline: Targets["deadline"]): number | null {
  if (!deadline?.value) return null;
  if (deadline.type === "FY") {
    const index = resolveLabelToIndex(deadline.value, true);
    return index;
  }
  return resolveLabelToIndex(deadline.value, false);
}

function formatDeadlineLabel(deadline: Targets["deadline"]): string {
  if (!deadline?.value) return "Not set";
  if (deadline.type === "FY") return deadline.value;
  const dateValue = Date.parse(deadline.value);
  if (Number.isNaN(dateValue)) return deadline.value;
  return new Date(dateValue).toLocaleDateString();
}

function resolveLabelToIndex(label: string, preferEndOfYear: boolean): number | null {
  const fiscalYear = parseFiscalYear(label);
  if (fiscalYear) {
    return fiscalYear * 12 + (preferEndOfYear ? 11 : 0);
  }
  const dateValue = Date.parse(label);
  if (Number.isNaN(dateValue)) return null;
  const dt = new Date(dateValue);
  return dt.getFullYear() * 12 + dt.getMonth();
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

type TargetScope = {
  regions: string[];
  brands?: string[];
  channels?: string[];
  storeFootprint?: {
    storeCount?: number;
    byRegion?: Record<string, number>;
  };
};

type Targets = {
  targetId: string;
  goal: string;
  deadline: { type: "FY" | "DATE"; value: string };
  budget?: { max?: number; currency: string };
  blackoutWindows?: { start: string; end: string; label?: string }[];
  constraints?: {
    maxDualRunMonths?: number;
    noBigBang?: boolean;
    requiredSystems?: string[];
  };
  scope: TargetScope;
};

type TargetFormState = {
  goal: string;
  deadlineType: "FY" | "DATE";
  deadlineValue: string;
  regions: string;
  brands: string;
  channels: string;
  budgetMax: string;
  currency: string;
  includeHolidayBlackout: boolean;
};

type FeasibilityStatus = "FEASIBLE" | "AT_RISK" | "NOT_FEASIBLE";

type FeasibilityBlockerCode =
  | "SCHEDULE_TOO_SHORT"
  | "BUDGET_TOO_LOW"
  | "BLACKOUT_CONFLICT"
  | "DEPENDENCY_GATE"
  | "COLLISION_PRESSURE"
  | "CAPACITY_LIMIT";

type FeasibilityBlocker = {
  code: FeasibilityBlockerCode;
  severity: 1 | 2 | 3;
  summary: string;
  evidence?: {
    relatedStageIds?: string[];
    systems?: string[];
    integrations?: string[];
    window?: { start: string; end: string };
    estimate?: { needed?: number; available?: number; units?: string };
  };
  suggestions?: string[];
};

type FeasibilityResult = {
  status: FeasibilityStatus;
  confidence: number;
  blockers: FeasibilityBlocker[];
  minRequired?: {
    durationMonths?: number;
    budgetFloor?: number;
  };
  whatIf?: {
    deadlinePlusMonths?: Record<number, FeasibilityStatus>;
  };
};
