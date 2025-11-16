"use client";

import React from "react";
import type {
  Artifact,
  InventoryRow,
  NormalizedApp,
} from "@/domain/model/modernization";
import { FuxiPanel } from "@/features/common/FuxiPanel";

type Props = {
  artifacts: Artifact[];
  inventoryRows: InventoryRow[];
  normalizedApps: NormalizedApp[];
  busy: boolean;
  error: string | null;
  onUploadInventory: (file: File) => Promise<void>;
  onUploadDiagram: (file: File, kind: "architecture_current" | "architecture_future") => Promise<void>;
};

const sectionClass =
  "shadow-sm border border-gray-100 rounded-2xl bg-white p-4 flex flex-col";

const inventoryExts = new Set(["xlsx", "xls", "csv", "txt"]);
const diagramExts = new Set(["png", "jpg", "jpeg", "pdf", "svg"]);

export function ModernizationImportPanel({
  artifacts,
  inventoryRows,
  normalizedApps,
  busy,
  error,
  onUploadInventory,
  onUploadDiagram,
}: Props) {
  const artifactInput = React.useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleArtifactUpload = (file: File) => {
    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (inventoryExts.has(ext)) {
      onUploadInventory(file);
      return;
    }
    if (diagramExts.has(ext)) {
      onUploadDiagram(file, "architecture_current");
      return;
    }
    setUploadError(
      "Unsupported artifact type. Please upload an Excel/CSV inventory or a PNG/JPG/PDF/SVG diagram."
    );
  };

  const combinedError = error || uploadError;

  return (
    <FuxiPanel title="Tech Stack Uploads" status={busy ? "Uploading…" : "Ready"}>
      {busy && (
        <div className="mb-3 text-sm font-medium text-gray-600">
          Processing your file… hang tight.
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <button className="btn" onClick={() => artifactInput.current?.click()} disabled={busy}>
          Upload Artifact
        </button>
        <input
          ref={artifactInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleArtifactUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      {combinedError && (
        <div className="text-sm text-red-600 mb-3">{combinedError}</div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Artifacts
            </div>
            <span className="badge">{artifacts.length}</span>
          </div>
          <ul className="list-disc ml-5 text-xs text-slate-700 space-y-1">
            {artifacts.map((a) => (
              <li key={a.id}>
                {a.kind} · {a.filename}
              </li>
            ))}
            {artifacts.length === 0 && <li className="text-gray-400">No uploads yet</li>}
          </ul>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Inventory rows
            </div>
            <span className="badge">{inventoryRows.length}</span>
          </div>
          <ul className="list-disc ml-5 text-xs text-slate-700 space-y-1">
            {inventoryRows.slice(0, 5).map((row, idx) => (
              <li key={`${row.systemName}-${idx}`}>
                {row.systemName}
                {row.vendor ? ` — ${row.vendor}` : ""}
              </li>
            ))}
            {inventoryRows.length > 5 && (
              <li className="text-slate-500">and {inventoryRows.length - 5} more…</li>
            )}
            {!inventoryRows.length && (
              <li className="text-gray-400">Upload an inventory sheet to populate rows</li>
            )}
          </ul>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Normalized apps
            </div>
            <span className="badge">{normalizedApps.length}</span>
          </div>
          <ul className="list-disc ml-5 text-xs text-slate-700 space-y-1">
            {normalizedApps.slice(0, 5).map((app) => (
              <li key={app.id}>{app.normalizedName}</li>
            ))}
            {normalizedApps.length > 5 && (
              <li className="text-slate-500">and {normalizedApps.length - 5} more…</li>
            )}
            {!normalizedApps.length && (
              <li className="text-gray-400">Normalization will happen once rows are processed</li>
            )}
          </ul>
        </section>
      </div>
    </FuxiPanel>
  );
}
