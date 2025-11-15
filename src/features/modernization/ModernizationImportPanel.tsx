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
  onUploadDiagram: (file: File, kind: "architecture_current" | "architecture_future") => Promise<void>;
};

export function ModernizationImportPanel({
  artifacts,
  inventoryRows,
  normalizedApps,
  busy,
  error,
  onUploadInventory,
  onUploadDiagram,
}: Props) {
  const inventoryInput = React.useRef<HTMLInputElement | null>(null);
  const diagramInput = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Modernization Uploads</div>
        <div className="text-xs" style={{ opacity: 0.6 }}>
          {busy ? "Uploading..." : "Ready"}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        <button className="btn" onClick={() => inventoryInput.current?.click()} disabled={busy}>
          Upload Inventory (.xlsx)
        </button>
        <input
          ref={inventoryInput}
          type="file"
          accept=".xls,.xlsx"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadInventory(file);
            e.target.value = "";
          }}
        />

        <button className="btn" onClick={() => diagramInput.current?.click()} disabled={busy}>
          Upload Diagram (current)
        </button>
        <input
          ref={diagramInput}
          type="file"
          accept=".png,.jpg,.pdf,.svg"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadDiagram(file, "architecture_current");
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <section className="p-3 border rounded">
          <div className="text-sm font-semibold mb-2">Artifacts ({artifacts.length})</div>
          <ul className="list-disc ml-5 text-xs">
            {artifacts.map((a) => (
              <li key={a.id}>
                {a.kind} · {a.filename}
              </li>
            ))}
          </ul>
        </section>
        <section className="p-3 border rounded">
          <div className="text-sm font-semibold mb-2">Inventory rows ({inventoryRows.length})</div>
          <ul className="list-disc ml-5 text-xs">
            {inventoryRows.slice(0, 5).map((row, idx) => (
              <li key={`${row.systemName}-${idx}`}>{row.systemName}</li>
            ))}
            {inventoryRows.length > 5 && <li>and {inventoryRows.length - 5} more…</li>}
          </ul>
        </section>
        <section className="p-3 border rounded">
          <div className="text-sm font-semibold mb-2">Normalized apps ({normalizedApps.length})</div>
          <ul className="list-disc ml-5 text-xs">
            {normalizedApps.slice(0, 5).map((app) => (
              <li key={app.id}>{app.normalizedName}</li>
            ))}
            {normalizedApps.length > 5 && <li>and {normalizedApps.length - 5} more…</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
