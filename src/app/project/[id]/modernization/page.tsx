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
    <ModernizationImportPanel
      artifacts={artifacts}
      inventoryRows={inventoryRows}
      normalizedApps={normalizedApps}
      busy={busy}
      error={error}
      onUploadInventory={uploadInventory}
      onUploadDiagram={uploadDiagram}
    />
  );
}
