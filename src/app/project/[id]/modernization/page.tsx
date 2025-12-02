"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useModernizationArtifacts } from "@/controllers/useModernizationArtifacts";
import { ModernizationImportPanel } from "@/features/tech-stack/ModernizationImportPanel";
import { useModernizationSummary } from "@/features/tech-stack/useModernizationSummary";
import { useTelemetry } from "@/hooks/useTelemetry";

export default function ModernizationPage() {
  const params = useParams<{ id: string }>();
  const telemetry = useTelemetry("tech_stack", { projectId: params.id });
  const {
    artifacts,
    inventoryRows,
    normalizedApps,
    busy,
    error,
    uploadInventory,
    uploadDiagram,
    uploadLucid,
  } = useModernizationArtifacts(params.id);

  const summary = useModernizationSummary();

  React.useEffect(() => {
    telemetry.log("tech_stack_view", {
      artifacts: artifacts?.length ?? 0,
      inventory: inventoryRows?.length ?? 0,
      normalized: normalizedApps?.length ?? 0,
    });
  }, [telemetry, artifacts?.length, inventoryRows?.length, normalizedApps?.length]);

  const handleUploadLucid = async (file: File) => {
    const start = performance.now();
    telemetry.log("upload_start", { fileType: file.type || "csv", size: file.size });
    try {
      await uploadLucid(file);
      telemetry.log("upload_complete", {
        fileType: file.type || "csv",
        size: file.size,
        duration_ms: Math.round(performance.now() - start),
      });
    } catch (err) {
      telemetry.log("upload_error", { message: (err as Error)?.message });
      throw err;
    }
  };

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
        projectId={params.id}
        artifacts={artifacts}
        inventoryRows={inventoryRows}
        normalizedApps={normalizedApps}
        busy={busy}
        error={error}
        onUploadInventory={uploadInventory}
        onUploadDiagram={uploadDiagram}
        onUploadLucid={handleUploadLucid}
      />
    </div>
  );
}
