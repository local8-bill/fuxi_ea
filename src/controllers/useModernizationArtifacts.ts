import { useState } from "react";
import type { Artifact, InventoryRow, NormalizedApp } from "@/domain/model/modernization";

export function useModernizationArtifacts(projectId: string) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [normalizedApps, setNormalizedApps] = useState<NormalizedApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadInventory(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("projectId", projectId);

      const res = await fetch("/api/mre/artifacts/inventory", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { artifact, rows } = await res.json();
      setArtifacts(prev => [...prev, artifact]);
      setInventoryRows(rows);
    } catch (e: any) {
      setError(e.message || "Failed to upload inventory");
    } finally {
      setBusy(false);
    }
  }

  async function uploadDiagram(file: File, kind: "architecture_current" | "architecture_future") {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      form.set("projectId", projectId);
      const res = await fetch("/api/mre/artifacts/diagram", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { artifact, boxes } = await res.json();
      setArtifacts(prev => [...prev, artifact]);
      // in a later step, we’ll pass boxes + inventoryRows to normalization
    } catch (e: any) {
      setError(e.message || "Failed to upload diagram");
    } finally {
      setBusy(false);
    }
  }

  // later: function to call normalization API and populate normalizedApps

  return {
    artifacts,
    inventoryRows,
    normalizedApps,
    busy,
    error,
    uploadInventory,
    uploadDiagram,
  };
}
