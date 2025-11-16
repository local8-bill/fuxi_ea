"use client";

import React from "react";
import type {
  Artifact,
  InventoryRow,
  NormalizedApp,
} from "@/domain/model/modernization";

type Props = {
  artifacts: Artifact[];
  inventoryRows: InventoryRow[];
  normalizedApps: NormalizedApp[];
  busy: boolean;
  error: string | null;
  onUploadInventory: (file: File) => Promise<void>;
  onUploadDiagram: (
    file: File,
    kind: "architecture_current" | "architecture_future",
  ) => Promise<void>;
  /**
   * Optional Lucid CSV upload handler.
   * If not provided, the UI will show an error message instead of throwing.
   */
  onUploadLucid?: (file: File) => Promise<void>;
};

export function ModernizationImportPanel({
  artifacts,
  inventoryRows,
  normalizedApps,
  busy,
  error,
  onUploadInventory,
  onUploadDiagram,
  onUploadLucid,
}: Props) {
  const inventoryInputRef = React.useRef<HTMLInputElement | null>(null);
  const diagramInputRef = React.useRef<HTMLInputElement | null>(null);
  const lucidInputRef = React.useRef<HTMLInputElement | null>(null);

  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleInventoryChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    try {
      await onUploadInventory(file);
    } catch (err) {
      console.error("inventory upload failed", err);
      setUploadError("Failed to upload inventory file.");
    }
  };

  const handleDiagramChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    try {
      // For now we treat everything as current-state architecture;
      // we can extend to a future/current toggle later.
      await onUploadDiagram(file, "architecture_current");
    } catch (err) {
      console.error("diagram upload failed", err);
      setUploadError("Failed to upload architecture diagram.");
    }
  };

  const handleLucidChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);

    if (!onUploadLucid) {
      // Don’t crash – just tell the user this path isn’t wired yet.
      console.warn("Lucid upload handler not provided");
      setUploadError("Lucid CSV upload is not wired yet in this build.");
      return;
    }

    try {
      await onUploadLucid(file);
    } catch (err) {
      console.error("lucid upload failed", err);
      setUploadError("Failed to upload Lucid CSV.");
    }
  };

  return (
    <div className="card mb-6 border border-slate-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            Tech Stack Inputs
          </div>
          <div className="text-xs text-slate-500">
            Upload inventories, diagrams, and (optionally) Lucid CSV to build
            your ecosystem.
          </div>
        </div>
        <div className="text-xs" style={{ opacity: 0.7 }}>
          {busy ? "Processing…" : "Ready"}
        </div>
      </div>

      {/* Upload controls */}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn text-xs"
          type="button"
          disabled={busy}
          onClick={() => inventoryInputRef.current?.click()}
        >
          Upload Inventory (.xlsx / .csv)
        </button>
        <input
          ref={inventoryInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={handleInventoryChange}
        />

        <button
          className="btn text-xs"
          type="button"
          disabled={busy}
          onClick={() => diagramInputRef.current?.click()}
        >
          Upload Architecture Diagram
        </button>
        <input
          ref={diagramInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,.svg"
          style={{ display: "none" }}
          onChange={handleDiagramChange}
        />

        <button
          className="btn text-xs"
          type="button"
          disabled={busy}
          onClick={() => lucidInputRef.current?.click()}
        >
          Upload Lucid CSV
        </button>
        <input
          ref={lucidInputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleLucidChange}
        />
      </div>

      {(error || uploadError) && (
        <div className="text-xs text-red-600">
          {uploadError ?? error}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-3 md:grid-cols-3 text-xs text-slate-600">
        <section>
          <div className="font-semibold text-slate-900">
            {artifacts?.length ?? 0}
          </div>
          <div className="opacity-70">Artifacts uploaded</div>
        </section>
        <section>
          <div className="font-semibold text-slate-900">
            {inventoryRows?.length ?? 0}
          </div>
          <div className="opacity-70">Inventory rows</div>
        </section>
        <section>
          <div className="font-semibold text-slate-900">
            {normalizedApps?.length ?? 0}
          </div>
          <div className="opacity-70">Normalized apps</div>
        </section>
      </div>
    </div>
  );
}
