"use client";

import { Button } from "@/components/ui/Button";
import { TransitionOrchestrator, useSceneManager, type SceneType } from "@/lib/scene";
import { DigitalTwinScene } from "@/scenes/DigitalTwinScene";
import { SequenceScene } from "@/scenes/SequenceScene";
import { RoiScene } from "@/scenes/RoiScene";
import { IntelligenceScene } from "@/scenes/IntelligenceScene";

const sceneConfig: Record<SceneType, { label: string; element: JSX.Element }> = {
  digitalTwin: { label: "Digital Twin", element: <DigitalTwinScene /> },
  sequence: { label: "Sequence", element: <SequenceScene /> },
  roi: { label: "ROI / TCC", element: <RoiScene /> },
  intelligence: { label: "Org Intelligence", element: <IntelligenceScene /> },
};

export default function SceneTransitionTestPage() {
  const activeScene = useSceneManager((state) => state.activeScene);
  const setScene = useSceneManager((state) => state.setScene);
  const reset = useSceneManager((state) => state.reset);
  const log = useSceneManager((state) => state.transitionLog);

  return (
    <div className="min-h-screen bg-[#0c0c15] px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-white/10 bg-[#141424] p-4">
          <p className="text-xs uppercase tracking-[0.4em] text-[#a1a1aa]">Dev Harness</p>
          <h1 className="text-3xl font-semibold">Scene Transition Test Plan</h1>
          <p className="text-sm text-slate-300">
            Exercises Digital Twin → Sequence → ROI/TCC → Intelligence loop per directives D086D–E. No UXShell dependencies, Shadcn-only layout.
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-[#111123] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(sceneConfig) as SceneType[]).map((scene) => (
              <Button key={scene} variant={scene === activeScene ? "default" : "outline"} onClick={() => setScene(scene, "manual_switch")}>
                {sceneConfig[scene].label}
              </Button>
            ))}
            <Button variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
          <p className="mt-2 text-sm text-slate-400">Active scene: {sceneConfig[activeScene].label}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0f0f1d] p-4">
          <TransitionOrchestrator className="h-full" renderScene={(sceneKey) => sceneConfig[sceneKey].element} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#141424] p-4 text-sm text-slate-300">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Telemetry Log</p>
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {log.map((entry, idx) => (
              <div key={`${entry.scene}-${entry.timestamp}-${idx}`} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                <span>{sceneConfig[entry.scene].label}</span>
                <span className="text-xs text-slate-500">{new Date(entry.timestamp).toISOString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
