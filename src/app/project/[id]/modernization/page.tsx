"use client";

import { useParams } from "next/navigation";
import { useModernizationArtifacts } from "@/controllers/useModernizationArtifacts";
import { ModernizationImportPanel } from "@/features/modernization/ModernizationImportPanel";
import { ProjectHeaderSummary } from "@/features/common/ProjectHeaderSummary";
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
      <section className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
          Tech Stack
        </span>
        <ProjectHeaderSummary
          variant="techStack"
          domainFilter="All Domains"
          sortKey="name"
          summary={summary}
        />
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
