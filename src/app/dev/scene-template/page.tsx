"use client";

import SceneLayout from "@/templates/SceneLayout";

export default function SceneTemplateDemo() {
  return (
    <SceneLayout
      main={
        <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 text-center text-slate-500">
          <p className="text-xs uppercase tracking-[0.35em]">Stage</p>
          <p className="mt-3 text-sm text-slate-400">Drop graph canvas or sequence builder here.</p>
        </div>
      }
    />
  );
}
