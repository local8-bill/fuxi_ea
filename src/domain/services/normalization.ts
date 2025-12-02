import type { ArtifactKind, InventoryRow, NormalizedApp, Disposition } from "@/domain/model/modernization";

type NormalizedBucket = {
  normalizedName: string;
  rawLabels: Set<string>;
  vendor?: string;
  disposition?: Disposition;
  sourceKinds: Set<ArtifactKind>;
};

function normalizeKey(label: string) {
  return label.trim().toUpperCase();
}

function normalizeDisposition(raw?: string): Disposition {
  if (!raw) return "UNKNOWN";
  const normalized = raw.trim().toUpperCase();
  if (["SUSTAIN", "MODERNIZE", "REPLACE", "RETIRE", "NEW"].includes(normalized)) {
    return normalized as Disposition;
  }
  return "UNKNOWN";
}

export async function normalizeAppsFromSources(params: {
  inventoryRows: InventoryRow[];
  diagramBoxes: { label: string; kind: ArtifactKind }[];
}): Promise<NormalizedApp[]> {
  const buckets = new Map<string, NormalizedBucket>();

  const addLabel = (label: string, kind: ArtifactKind, vendor?: string, dispositionRaw?: string) => {
    const key = normalizeKey(label);
    if (!key || key === "") return;
    const bucket = buckets.get(key) ?? {
      normalizedName: label.trim(),
      rawLabels: new Set<string>(),
      sourceKinds: new Set<ArtifactKind>(),
    };
    bucket.rawLabels.add(label.trim());
    bucket.sourceKinds.add(kind);
    if (vendor && !bucket.vendor) bucket.vendor = vendor.trim();
    if (!bucket.disposition && dispositionRaw) bucket.disposition = normalizeDisposition(dispositionRaw);
    buckets.set(key, bucket);
  };

  params.inventoryRows.forEach((row) => {
    addLabel(row.systemName, "inventory_excel", row.vendor, row.dispositionRaw);
  });

  params.diagramBoxes.forEach((box) => {
    addLabel(box.label, box.kind);
  });

  const apps: NormalizedApp[] = [];
  for (const [key, bucket] of buckets.entries()) {
    apps.push({
      id: `${key}-${Math.random().toString(36).slice(2, 8)}`,
      normalizedName: bucket.normalizedName,
      rawLabels: Array.from(bucket.rawLabels),
      vendor: bucket.vendor,
      sourceKinds: Array.from(bucket.sourceKinds),
      disposition: bucket.disposition,
    });
  }

  return apps;
}
