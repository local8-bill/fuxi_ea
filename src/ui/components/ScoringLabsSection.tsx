"use client";

import type { StoragePort } from "@/domain/ports/storage";
import { ImportPanel } from "./ImportPanel";
import { VisionPanel, VisionSuggestion } from "./VisionPanel";

type Props = {
  projectId: string;
  storage: StoragePort;
  existingL1: string[];
  onImportApplied?: () => void;
  onVisionAccept: (suggestion: VisionSuggestion) => void;
};

export function ScoringLabsSection({
  projectId,
  storage,
  existingL1,
  onImportApplied,
  onVisionAccept,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-start">
      <section className="card h-full min-h-[300px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Import (CSV / JSON) — Labs</h2>
          <span className="text-xs opacity-60">Tools</span>
        </div>
        <div className="flex-1">
          <ImportPanel
            bare
            projectId={projectId}
            storage={storage}
            existingL1={existingL1}
            onApplied={onImportApplied}
          />
        </div>
      </section>

      <section className="card h-full flex flex-col">
        <header className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Vision (Labs)</h2>
          <span className="text-xs opacity-60">Tools</span>
        </header>
        <div className="flex-1">
          <VisionPanel onAccept={onVisionAccept} />
        </div>
      </section>
    </div>
  );
}
