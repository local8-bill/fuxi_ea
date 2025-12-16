"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Stage } from "@/components/layout/Stage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { GraphSequencerPanel, GraphEventConsole, type GraphSequencerItem } from "@/components/graph/GraphSequencerPanel";
import { useTelemetry } from "@/hooks/useTelemetry";
import type { GraphFocus, GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import { useALEContext } from "@/lib/ale/contextStore";
import type { AleContext } from "@/lib/ale/contextStore";
import type { LivingMapData } from "@/types/livingMap";
import { useSequencerBridge } from "@/hooks/useSequencerBridge";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import sequenceIndex from "@/data/sequences/index.json";

const SEQUENCE_REGISTRY = sequenceIndex as SequenceRegistryEntry[];

const sequenceLoaders: Record<string, () => Promise<ModernizationSequence>> = {
  oms_modernization: () => import("@/data/sequences/oms_modernization.json").then((mod) => mod.default as ModernizationSequence),
  ebs_reduction_sprint: () => import("@/data/sequences/ebs_reduction_sprint.json").then((mod) => mod.default as ModernizationSequence),
  product_pipeline_enhancement: () => import("@/data/sequences/product_pipeline_enhancement.json").then((mod) => mod.default as ModernizationSequence),
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
};

type ModernizationSequence = {
  id: string;
  title: string;
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
  const { roiSignals, tccSignals, readiness, context: aleLiveContext } = useALEContext();
  const { ref: stageContainerRef, size: stageSize } = useResizeObserver<HTMLDivElement>();
  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [sequenceAleContext, setSequenceAleContext] = useState<AleContext>(null);
  const [intent, setIntent] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [sequence, setSequence] = useState<GraphSequencerItem[]>([]);
  const [activePhase, setActivePhase] = useState("FY26");
  const [events, setEvents] = useState<string[]>(["Sequencer ready."]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [selectedSequenceId, setSelectedSequenceId] = useState(defaultSequenceId);
  const [activeSequence, setActiveSequence] = useState<ModernizationSequence | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const { submitIntent, status: intentStatus, error: intentError } = useSequencerBridge({
    sequence,
    setSequence,
    onConfirmation: (message, context) => {
      setEvents((prev) => [message, ...prev].slice(0, 8));
      log("sequencer.intent_applied", { projectId, mutation: context.mutation.mutationType });
    },
  });

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
      setSequenceAleContext(payload.aleContext ?? null);
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

  const handleSequenceSave = async () => {
    if (!graphData) return;
    setSaving(true);
    try {
      await fetch("/api/sequences/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: intent,
          graph: graphData,
          aleContext: sequenceAleContext,
          createdAt: new Date().toISOString(),
        }),
      });
      log("sequencer.saved", { projectId });
    } catch (err) {
      console.error("[SequencerScene] failed to save sequence", err);
    } finally {
      setSaving(false);
    }
  };

  const focusLabel = useMemo(() => {
    if (intent) return intent;
    if (activeSequence) return `${activeSequence.title} · ${activeSequence.fyStart}–${activeSequence.fyEnd}`;
    if (source) return `Source · ${source}`;
    return null;
  }, [activeSequence, intent, source]);

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

  const viewMode: GraphViewMode = "sequencer";
  const sequencerFocus: GraphFocus = "stage";
  const sequencerStage: GraphRevealStage = "exploration";
  const activeAleContext = sequenceAleContext ?? aleLiveContext;
  const fallbackRoiSignals = Object.keys(roiSignals).length ? roiSignals : ((activeAleContext?.roi_signals as Record<string, unknown>) ?? {});
  const fallbackTccSignals = Object.keys(tccSignals).length ? tccSignals : ((activeAleContext?.tcc_signals as Record<string, unknown>) ?? {});
  const fallbackReadiness = Object.keys(readiness).length ? readiness : ((activeAleContext?.readiness as Record<string, unknown>) ?? {});
  const readinessAvailable = Object.keys(fallbackReadiness).length > 0;
  const readinessLabel = readinessAvailable ? "Connected" : "Not available";
  const responsiveDomainColumns = useMemo(() => {
    const width = stageSize.width;
    if (!width) return 3;
    if (width > 1800) return 5;
    if (width > 1400) return 4;
    if (width < 700) return 1;
    if (width < 1000) return 2;
    return 3;
  }, [stageSize.width]);

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

  const handleScenarioSelect = useCallback(
    (scenarioId: string) => {
      setActiveScenarioId(scenarioId);
      const timelineItem = sequence.find((item) => item.id === scenarioId);
      if (timelineItem) {
        setActivePhase(timelineItem.phase);
      }
      if (activeSequence) {
        const scenario = activeSequence.scenarios.find((s) => s.id === scenarioId);
        if (scenario) {
          setEvents((prev) => [`Activated ${scenario.title}`, ...prev].slice(0, 6));
        }
      }
    },
    [activeSequence, sequence],
  );

  const handleIntentSubmit = useCallback(async () => {
    if (!commandInput.trim()) return;
    const ok = await submitIntent(commandInput);
    if (ok) {
      setCommandInput("");
    }
  }, [commandInput, submitIntent]);

  const sequenceDetails = useMemo(() => SEQUENCE_REGISTRY.find((entry) => entry.id === selectedSequenceId), [selectedSequenceId]);

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
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
            <p className="font-semibold uppercase tracking-[0.35em] text-slate-500">Targets</p>
            <p className="mt-2 text-slate-900">ROI: {activeSequence.roiTarget.toFixed(1)}%</p>
            <p className="text-slate-900">TCC: {activeSequence.tccTarget.toFixed(1)}%</p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Readiness Index · {activeSequence.readinessIndex}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs">
            <p className="font-semibold uppercase tracking-[0.35em] text-slate-500">ALE Context</p>
            <p className="mt-1 text-slate-900">{activeAleContext ? "Hydrated" : "Missing"}</p>
            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
              Mode {viewMode} · Focus {sequencerFocus} · Stage {sequencerStage}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );

  const rightRailContent = (
    <div className="space-y-4">
      <Card>
        <div className="space-y-2 text-sm text-slate-700">
          <p className="text-sm font-semibold text-slate-900">Live Signals</p>
          <p className="text-xs text-slate-500">Readiness: {readinessLabel}</p>
          <p className="text-xs text-slate-500">ROI signals: {Object.keys(fallbackRoiSignals).length}</p>
          <p className="text-xs text-slate-500">TCC signals: {Object.keys(fallbackTccSignals).length}</p>
          <div className="pt-2 text-right">
            <Button onClick={handleSequenceSave} disabled={saving || !graphData}>
              {saving ? "Saving…" : "Save Sequence"}
            </Button>
          </div>
        </div>
      </Card>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Scenarios</p>
        {activeSequence?.scenarios.map((scenario) => {
          const readinessPercent = Math.round(Math.min(1, Math.max(0, scenario.readiness)) * 100);
          const isActive = scenario.id === activeScenarioId;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => handleScenarioSelect(scenario.id)}
              className={clsx(
                "w-full rounded-2xl border px-3 py-3 text-left text-sm transition",
                isActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-400",
              )}
            >
              <p className="font-semibold text-slate-900">{scenario.title}</p>
              <p className="text-xs text-slate-500">{scenario.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600">
                <span>ROI Δ {scenario.roiDelta.toFixed(1)}%</span>
                <span>TCC Δ {scenario.tccDelta.toFixed(1)}%</span>
                <span>Risk {Math.round(scenario.riskScore * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${readinessPercent}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-500">
                {scenario.aleSignals.map((signal) => (
                  <span key={signal} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                    {signal}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
        {!activeSequence?.scenarios?.length ? <p className="text-xs text-slate-500">No scenarios available.</p> : null}
      </div>
      <Card>
        <div className="space-y-3 text-sm text-slate-700">
          <div>
            <p className="text-sm font-semibold text-slate-900">Apply Intent</p>
            <p className="text-xs text-slate-500">Send a quick instruction to reprioritize the sequence.</p>
          </div>
          <textarea
            className="h-24 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
            placeholder="e.g. Shift OMS modernization to EMEA Q1..."
            value={commandInput}
            onChange={(event) => setCommandInput(event.target.value)}
            disabled={intentStatus === "working"}
          />
          {intentError ? <p className="text-xs text-rose-500">{intentError}</p> : null}
          <div className="pt-1 text-right">
            <Button onClick={handleIntentSubmit} disabled={intentStatus === "working" || !commandInput.trim()}>
              {intentStatus === "working" ? "Applying..." : "Update Sequence"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const domainChips = activeSequence?.domains ?? [];

  return (
    <SceneTemplate leftRail={leftRailContent} rightRail={rightRailContent}>
      <div ref={stageContainerRef} className="flex h-full flex-1">
        <Stage padded={false} className="h-full">
          <div className="border-b border-slate-200 px-6 py-4 text-slate-900">
            <h2 className="text-2xl font-semibold">Sequencer Timeline</h2>
            <p className="text-sm text-slate-600">{activeSequence ? activeSequence.title : "Select a sequence to begin."}</p>
            <p className="text-xs text-slate-500">{focusSummary}</p>
            {domainChips.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {domainChips.map((domain) => (
                  <span key={domain} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {domain}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex-1 p-4">
            {graphData ? (
              <div className="h-full">
                <GraphCanvas
                  nodes={graphData.nodes ?? []}
                  edges={graphData.edges ?? []}
                  focus={sequencerFocus}
                  focusLabel={null}
                  focusSummary={focusSummary}
                  viewMode={viewMode}
                  stage={sequencerStage}
                  projectId={projectId}
                  height="100%"
                  domainColumns={responsiveDomainColumns}
                  fitViewKey={responsiveDomainColumns}
                  showCanvasControls={false}
                />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <GraphSequencerPanel
                  sequence={sequence}
                  activePhase={activePhase}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onSimulate={handleSimulate}
                  highlightSequenceId={activeScenarioId}
                />
                <GraphEventConsole events={events} emptyMessage="Interact with the sequence to see optimization prompts." />
              </div>
            )}
          </div>
        </Stage>
      </div>
    </SceneTemplate>
  );
}

function buildTimeline(sequence: ModernizationSequence): GraphSequencerItem[] {
  const bands = buildFiscalBands(sequence.fyStart, sequence.fyEnd, sequence.scenarios.length);
  return sequence.scenarios.map((scenario, index) => {
    const tccValue = sequence.tccTarget + scenario.tccDelta;
    const roiValue = (sequence.roiTarget + scenario.roiDelta) / 100;
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
