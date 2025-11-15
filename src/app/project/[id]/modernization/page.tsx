"use client";

import { useParams } from "next/navigation";
import { useModernizationArtifacts } from "@/controllers/useModernizationArtifacts";
import { ModernizationImportPanel } from "@/features/modernization/ModernizationImportPanel";

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Modernization Workspace
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 mt-2">
          Modernization Workspace
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload capability inventories and diagrams, then explore normalized applications and artifact history.
        </p>
      </div>
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
