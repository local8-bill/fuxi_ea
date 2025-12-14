import { useEffect, useState } from "react";
import { Stage } from "@/components/layout/Stage";
import { Rail } from "@/components/layout/Rail";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { GraphCanvas } from "@/components/graph/GraphCanvas";
import { useTelemetry } from "@/hooks/useTelemetry";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";

/**
 * D086-I Sequencer Scene Directive
 * Purpose: Consume harmonized graph + ALE context persisted from Digital Twin and render timeline-driven view.
 * Styling: Graphite theme, Shadcn layout, minimal chrome.
 */

export default function SequencerScene({ projectId }: { projectId: string }) {
  const { log } = useTelemetry("sequencer", { projectId });
  const [graphData, setGraphData] = useState<any | null>(null);
  const [aleContext, setAleContext] = useState<any | null>(null);
  const [intent, setIntent] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("fuxi_sequence_intent");
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      setGraphData(payload.graph);
      setAleContext(payload.aleContext);
      setIntent(payload.prompt);
      setSource(payload.source);
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
      alert("Sequence saved successfully");
    } catch (err) {
      console.error("[SequencerScene] failed to save sequence", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stage>
      <Rail side="left" title="Focus Filters">
        <div className="space-y-3 text-sm text-white/80">
          <p>Sequence Intent:</p>
          <p className="text-white font-semibold">{intent || "(none)"}</p>
          <div className="mt-4 border-t border-white/10 pt-2">
            <p className="uppercase tracking-[0.2em] text-xs text-white/50">Source</p>
            <p className="text-white">{source || "Unspecified"}</p>
          </div>
        </div>
      </Rail>

      <div className="flex-1">
        <div className="px-6 py-4 border-b border-white/10 text-white">
          <h2 className="text-2xl font-semibold">Sequencer Timeline</h2>
          <p className="text-sm text-white/60">Visualizing modernization sequence based on uploaded architecture</p>
        </div>
        <div className="p-4">
          <div className="rounded-2xl border border-white/10 bg-[#10101c] p-3">
            {graphData ? (
              <GraphCanvas
                nodes={graphData.nodes ?? []}
                edges={graphData.edges ?? []}
                viewMode="sequencer"
                height={760}
                projectId={projectId}
                showCanvasControls={false}
              />
            ) : (
              <div className="py-40 text-center text-sm text-white/70">No sequence data available. Return to Digital Twin to generate one.</div>
            )}
          </div>
        </div>
      </div>

      <Rail side="right" title="Sequence Panel">
        <Card className="bg-white/10 border border-white/20 text-white">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Readiness</p>
            <p className="text-xs">{aleContext?.readiness ? "Loaded" : "Not available"}</p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">ROI / TCC Summary</p>
            <p className="text-xs">Signals: {Object.keys(aleContext?.roi_signals ?? {}).length}</p>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSequenceSave} disabled={saving}>
              {saving ? "Saving..." : "Save Sequence"}
            </Button>
          </div>
        </Card>
      </Rail>
    </Stage>
  );
}

/*
====================================================================
🔧 Implementation Instructions for DX — D086-I Sequencer Scene
====================================================================

Scope (only):
Implement this new SequencerScene.tsx exactly as provided — no stylistic or creative additions.

Do not:
- Alter existing Scenes (Digital Twin, ExperienceShell, Rail, Stage)
- Change global theme or graph styles
- Add animations, icons, gradients, or layout tweaks

To Do:
1. Add this file under src/app/project/[id]/sequencer/SequencerScene.tsx
2. Register route: /project/[id]/experience?scene=sequencer → renders this scene.
3. Implement stub API: /src/app/api/sequences/save/route.ts → accepts POST, writes to .fuxi/data/sequences.json.
4. Verify:
   - Entering from Digital Twin hydrates sessionStorage payload.
   - Graph + ALE context render properly.
   - “Save Sequence” writes to stub successfully.
5. Telemetry: respect existing logging (sequencer.hydrated, sequencer.saved), no new events.

Expected Behavior:
- Left rail → shows context (intent + source)
- Center → harmonized graph view
- Right rail → ROI/TCC + readiness placeholders + save action
- Scene transition smooth from Digital Twin
====================================================================
*/
