"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { usePredictiveScenarios, type PredictiveScenario } from "@/hooks/usePredictiveScenarios";

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
type GraphSystem = {
  id: string;
  title: string;
  impact: number;
  stage: string;
  phase: string;
  vendors?: string[];
  aleTags?: string[];
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

type SelectedNode =
  | { kind: "domain"; domain: GraphDomain }
  | { kind: "system"; domain: GraphDomain; system: GraphSystem };

const dataset = graphData as GraphDataset;
const roiData = roiMetricsData as Record<string, { roi: number; tcc: number; risk: number }>;
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

function buildGraphDatasetFromApi(data: { nodes?: any[] } | null | undefined): GraphDataset | null {
  if (!data?.nodes) return null;
  const domainPalette: Record<string, string> = {
    commerce: "from-amber-200 via-amber-100 to-amber-50",
    finance: "from-sky-200 via-sky-100 to-sky-50",
    supply: "from-emerald-200 via-emerald-100 to-emerald-50",
    "supply chain": "from-emerald-200 via-emerald-100 to-emerald-50",
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
      domainsMap.set(domainKey, {
        domain: {
          id: domainKey,
          title,
          color: domainPalette[domainKey] ?? "from-slate-200 via-slate-100 to-white",
          regions: [],
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [aleTags, setAleTags] = useState<string[]>([]);
  const { summary: storeSummary } = useStoreData();

  const domains = graphDataset.domains;

  const stageMeta = useMemo(() => revealStages.find((s) => s.id === stage) ?? revealStages[0], [stage]);
  const phaseOrder = useMemo(() => timelineBands.map((band) => band.id), [timelineBands]);

  const aggregatedPhaseMetrics: PhaseInsight[] = useMemo(() => {
    return timelineBands.map((band) => {
      const systems = domains.flatMap((domain) => domain.systems.filter((system) => system.phase === band.id));
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
  }, [timelineBands, domains]);

  const predictiveScenarios = usePredictiveScenarios(aggregatedPhaseMetrics, activePhase);
  const activeScenario = useMemo(
    () => predictiveScenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [predictiveScenarios, selectedScenarioId],
  );

  const focusOption = useMemo(() => guidedFocusOptions.find((option) => option.id === focus) ?? guidedFocusOptions[0], [focus]);

  const logLearningEvent = useCallback((code: string, details?: Record<string, unknown>) => {
    setEventLog((prev) => [`${new Date().toLocaleTimeString()} · ${code}`, ...prev].slice(0, 6));
    void fetch("/api/ale/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, details }),
    }).catch(() => null);
  }, []);

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

  const handlePlaybackToggle = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      logLearningEvent(next ? "LE-006" : "LE-007", { playing: next });
      return next;
    });
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
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Prototype</p>
            <h1 className="text-3xl font-semibold text-slate-900">Enterprise OMS Transformation Graph</h1>
            <p className="text-sm text-slate-600">FY26–FY28 sequencing, ALE overlays, and EAgent guidance.</p>
          </header>

          <section className="grid gap-4 lg:grid-cols-3">
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
                <p className="text-[0.7rem] text-slate-500">
                  Active scenario · <span className="font-semibold text-slate-900">{activeScenario.title}</span> — ROI {(activeScenario.roiDelta * 100).toFixed(1)}% ·
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
              sequence={sequence}
              highlightedPhaseMetrics={aggregatedPhaseMetrics.find((metric) => metric.phase === activePhase)}
              scenarioPhase={activeScenario?.phase ?? null}
            />
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
              <GraphPredictivePanel
                scenarios={predictiveScenarios}
                selectedScenarioId={selectedScenarioId}
                onSelect={(scenario) => handleScenarioSelect(scenario)}
                onActivate={(scenario) => handleScenarioActivate(scenario)}
              />
              <NodeInspector nodeName={inspectorName} domain={inspectorDomain} tags={aleTags} />
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
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{title}</p>
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
        "w-full rounded-2xl border px-3 py-2 text-left text-sm transition",
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-800",
      )}
    >
      <p className="font-semibold">{label}</p>
      <p className={clsx("text-xs", active ? "text-slate-200" : "text-slate-500")}>{helper}</p>
    </button>
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
}) {
  const showEdges = stage === "connectivity" || stage === "insight";
  const showNodes = stage !== "orientation";
  const showOverlays = stage === "insight";
  const sequenceLookup = useMemo(() => new Map(sequence.map((item, index) => [item.system ?? item.id, { item, order: index }])), [sequence]);

  return (
    <section className="relative rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl">
      <TimelineBands bands={timeline} activePhase={activePhase} />
      <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="group cursor-pointer rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_35px_90px_-70px_rgba(15,23,42,0.8)]"
            onClick={() => onSelectNode({ kind: "domain", domain })}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{domain.title}</p>
                {focus === "stage" ? <p className="text-xs text-slate-500">Stage ribbon</p> : null}
              </div>
            </div>
            {showStoreOverlay ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {domain.regions.map((region) => (
                  <div
                    key={`${domain.id}-${region}`}
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.6rem]"
                  >
                    <span className="font-semibold uppercase tracking-[0.35em] text-slate-700">{region}</span>
                    <span className="text-slate-500">· {(storeSummary[region]?.total ?? 0).toLocaleString()} stores</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className={clsx("mt-4 space-y-3", showNodes ? "opacity-100" : "opacity-100")}
              aria-label={`${domain.title} systems`}>
              {domain.systems.map((system) => {
                const sequenceInfo = sequenceLookup.get(system.id);
                const isActivePhase = system.phase === activePhase;
                const isScenarioPhase = scenarioPhase && scenarioPhase === system.phase;
                return (
                  <button
                    key={system.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectNode({ kind: "system", domain, system });
                    }}
                    className={clsx(
                      "w-full rounded-2xl border px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/20",
                      isActivePhase
                        ? "border-emerald-500 bg-white"
                        : isScenarioPhase
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-slate-200 bg-white",
                      showEdges ? "hover:border-slate-900" : undefined,
                    )}
                  >
                    <p className="font-semibold text-neutral-950">{system.title}</p>
                    <p className="text-xs text-slate-700">Impact {(system.impact * 100).toFixed(0)}%</p>
                    {system.vendors?.length ? (
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{system.vendors.join(", ")}</p>
                    ) : null}
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-500">
                      {system.stage} · {system.phase.toUpperCase()}
                    </p>
                    {mode === "roi" && roiData[system.id] ? (
                      <div className="mt-2 text-xs text-slate-600">
                        ROI {(roiData[system.id].roi * 100).toFixed(0)}% · TCC ${roiData[system.id].tcc.toFixed(1)}M
                        <span className={clsx("ml-2 text-[0.65rem] font-semibold", riskState(roiData[system.id].risk).className)}>
                          {riskState(roiData[system.id].risk).label} risk
                        </span>
                      </div>
                    ) : null}
                    {mode === "sequencer" && sequenceInfo ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <p>
                          Sequence #{sequenceInfo.order + 1} · {sequenceInfo.item.phase.toUpperCase()} · {sequenceInfo.item.region}
                        </p>
                        {sequenceInfo.item.dependencies?.length ? (
                          <div className="flex flex-wrap gap-1 text-[0.6rem] text-slate-500">
                            {sequenceInfo.item.dependencies.map((dep) => (
                              <span key={`${system.id}-${dep}`} className="rounded-full border border-slate-200 px-2 py-0.5">
                                depends on {dep}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {showEdges ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-sm">
                <p className="font-semibold text-neutral-950 uppercase tracking-[0.2em] text-[0.6rem]">Integrations</p>
                <p className="mt-1 text-sm text-slate-700">OMS ↔ MFCS ↔ EBS connections live</p>
              </div>
            ) : null}
          </div>
        ))}
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
            "flex-1 rounded-[28px] border border-dashed border-white/40 px-3 py-4",
            band.id === activePhase ? "bg-emerald-50/60" : "bg-white/20",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{band.label}</p>
        </div>
      ))}
    </div>
  );
}
