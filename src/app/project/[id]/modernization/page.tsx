"use client";

import { useParams } from "next/navigation";
import { useModernizationArtifacts } from "@/controllers/useModernizationArtifacts";
import { ModernizationImportPanel } from "@/features/modernization/ModernizationImportPanel";
import { WorkspaceHeader } from "@/features/workspace/WorkspaceHeader";
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
      <WorkspaceHeader
        title="Tech Stack Workspace"
        subtitle="STATUS"
        description="Upload inventories and diagrams, then explore normalized applications and dependencies."
        variant="techStack"
        summary={summary}
      />
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
