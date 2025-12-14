"use client";

import { useEffect, useMemo, useState } from "react";
import { Stage } from "@/components/layout/Stage";
import { Rail } from "@/components/layout/Rail";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { useTelemetry } from "@/hooks/useTelemetry";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";
import type { GraphFocus, GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";

type StoredSequencePayload = {
  prompt: string;
  source?: string;
  graph: { nodes?: any[]; edges?: any[] };
  aleContext?: Record<string, unknown>;
};

export function SequencerScene({ projectId }: { projectId: string }) {
  const { log } = useTelemetry("sequencer", { projectId });
  const [graphData, setGraphData] = useState<StoredSequencePayload["graph"] | null>(null);
  const [aleContext, setAleContext] = useState<Record<string, unknown> | null>(null);
  const [intent, setIntent] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("fuxi_sequence_intent");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as StoredSequencePayload & { source?: string };
      setGraphData(payload.graph ?? null);
      setAleContext(payload.aleContext ?? null);
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
          aleContext,
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

  return (
    <div className="px-6 py-4">
      <div className="flex gap-4">
        <Rail side="left" collapsed={leftRailCollapsed} onToggle={() => setLeftRailCollapsed((prev) => !prev)} title="Focus Filters">
          <div className="space-y-4 text-sm text-white/80">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Sequence Intent</p>
              <p className="mt-1 text-white font-semibold leading-snug">{intent || "No intent provided"}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">Source</p>
              <p className="mt-1 text-white">{source || "Unspecified"}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">ALE Context</p>
              <p className="mt-1 text-white">{aleContext ? "Hydrated" : "Missing"}</p>
            </div>
          </div>
        </Rail>

        <Stage padded={false}>
          <div className="border-b border-white/10 px-6 py-4 text-white">
            <h2 className="text-2xl font-semibold">Sequencer Timeline</h2>
            <p className="text-sm text-white/60">Visualizing modernization sequence based on uploaded architecture</p>
          </div>
          <div className="flex-1 p-4">
            <div className="rounded-2xl border border-white/10 bg-[#10101c] p-3">
              {graphData ? (
                <GraphCanvas
                  nodes={(graphData.nodes as any[]) ?? []}
                  edges={(graphData.edges as any[]) ?? []}
                  focus={sequencerFocus}
                  focusLabel={intent || null}
                  focusSummary={focusSummary}
                  viewMode={viewMode}
                  stage={sequencerStage}
                  height={760}
                  projectId={projectId}
                  showCanvasControls={false}
                />
              ) : (
                <div className="py-40 text-center text-sm text-white/70">No sequence data available. Return to Digital Twin to generate one.</div>
              )}
            </div>
          </div>
        </Stage>

        <Rail side="right" collapsed={rightRailCollapsed} onToggle={() => setRightRailCollapsed((prev) => !prev)} title="Sequence Panel">
          <Card className="border border-white/20 bg-white/5 p-4 text-white">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Readiness</p>
              <p className="text-xs">{aleContext?.readiness ? "Loaded" : "Not available"}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">ROI / TCC Summary</p>
              <p className="text-xs">Signals: {Object.keys((aleContext?.roi_signals as Record<string, unknown>) ?? {}).length}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSequenceSave} disabled={saving || !graphData}>
                {saving ? "Saving..." : "Save Sequence"}
              </Button>
            </div>
          </Card>
        </Rail>
      </div>
    </div>
  );
}
