import { useCallback, useState } from "react";
import type {
  Artifact,
  InventoryRow,
  NormalizedApp,
  ArtifactKind,
} from "@/domain/model/tech-stack";
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
  uploadDiagram: (file: File, kind: ArtifactKind) => Promise<void>;
  uploadLucid: (file: File) => Promise<void>;
};

/**
 * Central controller for the Tech Stack / Modernization workspace.
 * - Upload inventory (XLS/XLSX/CSV)
 * - Upload diagrams (current/future)
 * - Upload Lucid CSV (for Digital Enterprise)
 * - Maintain normalized app list from inventory + diagrams
 */
export function useModernizationArtifacts(projectId: string): UseModernizationArtifactsResult {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const [normalizedApps, setNormalizedApps] = useState<NormalizedApp[]>([]);
  const [diagramBoxes, setDiagramBoxes] = useState<DiagramBox[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recomputeNormalized = useCallback(
    async (nextInventory: InventoryRow[], nextBoxes: DiagramBox[]) => {
      try {
        const apps = await normalizeAppsFromSources({
          inventoryRows: nextInventory,
          diagramBoxes: nextBoxes.map((b) => ({ label: b.label, kind: b.kind })),
        });
        setNormalizedApps(apps);
      } catch (err) {
        console.error("recomputeNormalized error", err);
        // Don't override an existing more-specific error message
        setError((prev) => prev ?? "Failed to normalize applications.");
      }
    },
    [],
  );

  async function uploadInventory(file: File) {
    try {
      setBusy(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch(
        `/api/mre/artifacts/inventory?project=${encodeURIComponent(projectId)}`,
        {
          method: "POST",
          body: formData,
        },
      );

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
      const nextInventory = [...inventoryRows, ...newRows];
      setInventoryRows(nextInventory);

      await recomputeNormalized(nextInventory, diagramBoxes);
    } catch (err) {
      console.error("uploadInventory error", err);
      setError("Failed to upload inventory.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadDiagram(file: File, kind: ArtifactKind) {
    try {
      setBusy(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      formData.append("kind", kind);

      const res = await fetch(
        `/api/mre/artifacts/diagram?project=${encodeURIComponent(projectId)}`,
        {
          method: "POST",
          body: formData,
        },
      );

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
      console.error("uploadDiagram error", err);
      setError("Failed to upload diagram.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Lucid CSV upload — used to feed the Digital Enterprise view.
   * We don't currently merge Lucid rows into normalizedApps here;
   * instead, the Digital Enterprise page reads stats from its own API.
   */
  async function uploadLucid(file: File) {
    try {
      setBusy(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch(
        `/api/digital-enterprise/lucid?project=${encodeURIComponent(projectId)}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Lucid upload failed: ${res.status} ${text}`);
      }

      const data = await res.json();
      console.log("Lucid upload OK", data);
      // Digital Enterprise stats will be read via /api/digital-enterprise/stats
      // so we don't need to mutate normalizedApps here (yet).
    } catch (err) {
      console.error("uploadLucid error", err);
      setError("Failed to upload Lucid CSV.");
    } finally {
      setBusy(false);
    }
  }

  return {
    artifacts,
    inventoryRows,
    normalizedApps,
    busy,
    error,
    uploadInventory,
    uploadDiagram,
    uploadLucid,
  };
}
