// src/controllers/useModernizationArtifacts.ts
"use client";

import { useState, useEffect } from "react";
import type {
  Artifact,
  InventoryRow,
  NormalizedApp,
  ArtifactKind,
} from "@/domain/model/modernization";
import { normalizeAppsFromSources } from "@/domain/services/normalization";

type DiagramBox = {
  label: string;
  kind: ArtifactKind;
};

type UseModernizationArtifactsResult = {
  artifacts: Artifact[];
  inventoryRows: InventoryRow[];
  normalizedApps: NormalizedApp[];
  busy: boolean;
  error: string | null;
  uploadInventory: (file: File) => Promise<void>;
  uploadDiagram: (
    file: File,
    kind: "architecture_current" | "architecture_future",
  ) => Promise<void>;
};

export function useModernizationArtifacts(
  projectId: string,
): UseModernizationArtifactsResult {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [diagramBoxes, setDiagramBoxes] = useState<DiagramBox[]>([]);
  const [normalizedApps, setNormalizedApps] = useState<NormalizedApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const SUMMARY_KEY = "fuxi-modernization-summary";

  const recomputeNormalized = async (
    nextInventoryRows: InventoryRow[],
    nextDiagramBoxes: DiagramBox[],
  ) => {
    try {
      const apps = await normalizeAppsFromSources({
        inventoryRows: nextInventoryRows,
        diagramBoxes: nextDiagramBoxes.map((b) => ({
          label: b.label,
          kind: b.kind,
        })),
      });
      setNormalizedApps(apps);
    } catch (err) {
      console.error("[Modernization] normalizeAppsFromSources failed:", err);
      setError("Failed to normalize applications.");
    }
  };

  const uploadInventory = async (file: File) => {
    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("kind", "inventory_excel");

      const res = await fetch("/api/mre/artifacts/inventory", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Inventory upload failed: ${res.status} ${text}`);
      }

      const data = (await res.json()) as {
        artifact: Artifact;
        inventoryRows?: InventoryRow[] | null;
      };

      setArtifacts((prev) => [...prev, data.artifact]);

      const newRows = data.inventoryRows ?? [];
      const nextInventoryRows = [...inventoryRows, ...newRows];
      setInventoryRows(nextInventoryRows);

      await recomputeNormalized(nextInventoryRows, diagramBoxes);
    } catch (err) {
      console.error("[Modernization] uploadInventory error:", err);
      setError("Failed to upload inventory.");
    } finally {
      setBusy(false);
    }
  };

  const uploadDiagram = async (
    file: File,
    kind: "architecture_current" | "architecture_future",
  ) => {
    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("projectId", projectId);
      form.append("kind", kind);

      const res = await fetch("/api/mre/artifacts/diagram", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Diagram upload failed: ${res.status} ${text}`);
      }

      const data = (await res.json()) as {
        artifact: Artifact;
        boxes?: { label: string; kind: ArtifactKind }[] | null;
      };

      setArtifacts((prev) => [...prev, data.artifact]);

      const boxes = data.boxes ?? [];
      const nextDiagramBoxes: DiagramBox[] = [
        ...diagramBoxes,
        ...boxes.map((b) => ({ label: b.label, kind: b.kind })),
      ];
      setDiagramBoxes(nextDiagramBoxes);

      await recomputeNormalized(inventoryRows, nextDiagramBoxes);
    } catch (err) {
      console.error("[Modernization] uploadDiagram error:", err);
      setError("Failed to upload diagram.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const summary = {
      artifacts: artifacts.length,
      inventoryRows: inventoryRows.length,
      normalizedApps: normalizedApps.length,
    };
    window.localStorage?.setItem(SUMMARY_KEY, JSON.stringify(summary));
  }, [artifacts.length, inventoryRows.length, normalizedApps.length]);

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
