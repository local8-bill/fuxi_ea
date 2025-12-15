"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Stage } from "@/components/layout/Stage";
import { Rail } from "@/components/layout/Rail";
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

type StoredSequencePayload = {
  prompt: string;
  source?: string;
  graph?: LivingMapData | null;
  aleContext?: AleContext;
};

const SequencerCanvasDisabled = () => (
  <div className="py-40 text-center text-sm text-white/70">
    Sequencer canvas temporarily disabled while we isolate the graph dependency.
  </div>
);

export function SequencerScene({ projectId }: { projectId: string }) {
  const { log } = useTelemetry("sequencer", { projectId });
  const { roiSignals, tccSignals, readiness, context: aleLiveContext } = useALEContext();
  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [sequenceAleContext, setSequenceAleContext] = useState<AleContext>(null);
  const [intent, setIntent] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [sequence, setSequence] = useState<GraphSequencerItem[]>(() => [
    { id: "seq-1", label: "Stabilize Commerce Core", phase: "FY25 Q4", region: "Global", cost: 3.4, impact: 0.68 },
    { id: "seq-2", label: "Migrate OMS/API", phase: "FY26 Q1", region: "NA/EU", cost: 4.1, impact: 0.74 },
    { id: "seq-3", label: "Modernize Data Hub", phase: "FY26 Q3", region: "Global", cost: 2.9, impact: 0.6 },
  ]);
  const [activePhase, setActivePhase] = useState("FY25 Q4");
  const [events, setEvents] = useState<string[]>(["Loaded sequencer placeholder timeline."]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [commandInput, setCommandInput] = useState("");
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

  const focusSummary = useMemo(() => {
    if (intent) return `Derived from user intent: ${intent}`;
    if (source) return `Sequence sourced from ${source}`;
    return "No sequence intent captured yet.";
  }, [intent, source]);

  const viewMode: GraphViewMode = "sequencer";
  const sequencerFocus: GraphFocus = "stage";
  const sequencerStage: GraphRevealStage = "exploration";
  const activeAleContext = sequenceAleContext ?? aleLiveContext;
  const fallbackRoiSignals = Object.keys(roiSignals).length ? roiSignals : ((activeAleContext?.roi_signals as Record<string, unknown>) ?? {});
  const fallbackTccSignals = Object.keys(tccSignals).length ? tccSignals : ((activeAleContext?.tcc_signals as Record<string, unknown>) ?? {});
  const fallbackReadiness = Object.keys(readiness).length ? readiness : ((activeAleContext?.readiness as Record<string, unknown>) ?? {});
  const readinessAvailable = Object.keys(fallbackReadiness).length > 0;
  const readinessLabel = readinessAvailable ? "Connected" : "Not available";

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
  const handleIntentSubmit = useCallback(async () => {
    if (!commandInput.trim()) return;
    const ok = await submitIntent(commandInput);
    if (ok) {
      setCommandInput("");
    }
  }, [commandInput, submitIntent]);

  return (
    <div className="px-6 py-4">
      <div className="flex gap-4">
        <Rail side="left" collapsed={leftRailCollapsed} onToggle={() => setLeftRailCollapsed((prev) => !prev)} title="Focus Filters">
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Sequence Intent</p>
              <p className="mt-1 font-semibold leading-snug text-white">{intent || "No intent provided"}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Source</p>
              <p className="mt-1 text-white">{source || "Unspecified"}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">ALE Context</p>
              <p className="mt-1 text-white">{activeAleContext ? "Hydrated" : "Missing"}</p>
            </div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-white/40">
              Mode {viewMode} · Focus {sequencerFocus} · Stage {sequencerStage}
            </p>
          </div>
        </Rail>

        <Stage padded={false}>
          <div className="border-b border-white/10 px-6 py-4 text-white">
            <h2 className="text-2xl font-semibold">Sequencer Timeline</h2>
            <p className="text-sm text-white/60">Visualizing modernization sequence based on uploaded architecture</p>
            <p className="text-xs text-white/50">{focusSummary}</p>
          </div>
          <div className="flex-1 p-4">
            {graphData ? (
              <div className="rounded-2xl border border-white/10 bg-[#10101c] p-3">
                <GraphCanvas
                  nodes={graphData.nodes ?? []}
                  edges={graphData.edges ?? []}
                  focus={sequencerFocus}
                  focusLabel={intent || null}
                  focusSummary={focusSummary}
                  viewMode={viewMode}
                  stage={sequencerStage}
                  projectId={projectId}
                  height={760}
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
                />
                <GraphEventConsole events={events} emptyMessage="Interact with the sequence to see optimization prompts." />
              </div>
            )}
          </div>
        </Stage>

        <Rail side="right" collapsed={rightRailCollapsed} onToggle={() => setRightRailCollapsed((prev) => !prev)} title="Sequence Panel">
          <Card className="border border-white/20 bg-white/5 p-4 text-white">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Readiness</p>
                <p className="text-xs">{readinessLabel}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">ROI / TCC Summary</p>
                <p className="text-xs">ROI signals: {Object.keys(fallbackRoiSignals).length}</p>
                <p className="text-xs">TCC signals: {Object.keys(fallbackTccSignals).length}</p>
              </div>
              <div className="pt-2 text-xs text-white/60">
                <p>Graph UI temporarily offline while we rehydrate the modernization sequencer canvas.</p>
              </div>
              <div className="pt-2 text-right">
                <Button onClick={handleSequenceSave} disabled={saving || !graphData}>
                  {saving ? "Saving..." : "Save Sequence"}
                </Button>
              </div>
            </div>
          </Card>
          <Card className="border border-white/20 bg-white/5 p-4 text-white">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Apply Intent</p>
                <p className="text-xs text-white/70">Send a quick instruction to reprioritize the sequence.</p>
              </div>
              <textarea
                className="h-24 w-full rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                placeholder="e.g. Shift OMS modernization to EMEA Q1..."
                value={commandInput}
                onChange={(event) => setCommandInput(event.target.value)}
                disabled={intentStatus === "working"}
              />
              {intentError ? <p className="text-xs text-rose-300">{intentError}</p> : null}
              <div className="pt-1 text-right">
                <Button onClick={handleIntentSubmit} disabled={intentStatus === "working" || !commandInput.trim()}>
                  {intentStatus === "working" ? "Applying..." : "Update Sequence"}
                </Button>
              </div>
            </div>
          </Card>
        </Rail>
      </div>
    </div>
  );
}
