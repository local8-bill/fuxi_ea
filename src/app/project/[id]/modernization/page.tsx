"use client";

import { useParams } from "next/navigation";
import { useModernizationArtifacts } from "@/controllers/useModernizationArtifacts";
import { ModernizationImportPanel } from "@/features/modernization/ModernizationImportPanel";
import { useModernizationSummary } from "@/features/modernization/useModernizationSummary";

export default function ModernizationPage() {
  const params = useParams<{ id: string }>();
  const {
    artifacts,
    inventoryRows,
    normalizedApps,
    busy,
    error,
    uploadInventory,
    uploadDiagram,
  } = useModernizationArtifacts(params.id);

  const summary = useModernizationSummary();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">STATUS</p>
        <h1 className="text-3xl font-semibold text-slate-900">Tech Stack Workspace</h1>
        <p className="text-sm text-slate-500">
          Upload inventories and diagrams, then explore normalized applications and dependencies.
        </p>
      </section>
      <ModernizationImportPanel
        artifacts={artifacts}
        inventoryRows={inventoryRows}
        normalizedApps={normalizedApps}
        busy={busy}
        error={error}
        onUploadInventory={uploadInventory}
        onUploadDiagram={uploadDiagram}
      />
    </div>
  );
}
