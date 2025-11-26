"use client";

import React from "react";
import type { ArtifactKind } from "@/domain/model/modernization";

type Artifact = {
  id: string;
  kind: string;
  filename: string;
};

type InventoryRow = {
  systemName: string;
};

type NormalizedApp = {
  id: string;
  normalizedName: string;
};

type Props = {
  projectId?: string;
  artifacts?: Artifact[];
  inventoryRows?: InventoryRow[];
  normalizedApps?: NormalizedApp[];
  busy?: boolean;
  error?: string | null;
  onUploadInventory?: (file: File) => Promise<void>;
  onUploadDiagram?: (file: File, kind: ArtifactKind) => Promise<void>;
  onUploadLucid: (file: File) => Promise<void>;
};

export function ModernizationImportPanel({
  projectId,
  artifacts,
  inventoryRows,
  normalizedApps,
  busy = false,
  error,
  onUploadLucid,
}: Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadBusy, setUploadBusy] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so same file can be picked twice
    if (!file) return;

    setUploadError(null);
    setUploadBusy(true);

    try {
      console.log(
        "[PANEL] Lucid file selected",
        file.name,
        "for project",
        projectId,
      );
      await onUploadLucid(file);
    } catch (err) {
      console.error("[PANEL] onUploadLucid failed", err);
      setUploadError("Failed to process Lucid CSV.");
    } finally {
      setUploadBusy(false);
    }
  };

  const artifactsCount = artifacts?.length ?? 0;
  const inventoryCount = inventoryRows?.length ?? 0;
  const normalizedCount = normalizedApps?.length ?? 0;

  return (
    <section className="card border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            INPUTS
          </p>
          <p className="text-sm text-slate-600">
            Upload a Lucid CSV export to light up the Digital Enterprise view
            for project <span className="font-semibold">{projectId}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary text-xs"
            type="button"
            onClick={handleClickUpload}
            disabled={uploadBusy || busy}
          >
            {uploadBusy ? "Uploading…" : "Upload Lucid CSV"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {(uploadError || error) && (
        <p className="text-xs text-red-500">{uploadError ?? error}</p>
      )}

      {/* Simple summary row so the panel still feels anchored in the workspace */}
      <div className="grid gap-4 sm:grid-cols-3 text-sm text-slate-700">
        <div className="rounded-xl border border-slate-200 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Artifacts
          </div>
          <div className="mt-1 text-lg font-semibold">{artifactsCount}</div>
          <div className="text-[11px] text-slate-500">
            Inventory / diagram / Lucid files in this project.
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Inventory Rows
          </div>
          <div className="mt-1 text-lg font-semibold">{inventoryCount}</div>
          <div className="text-[11px] text-slate-500">
            Application rows ingested from spreadsheets.
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 px-3 py-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Normalized Apps
          </div>
          <div className="mt-1 text-lg font-semibold">{normalizedCount}</div>
          <div className="text-[11px] text-slate-500">
            Systems clustered into canonical applications.
          </div>
        </div>
      </div>
    </section>
  );
}
