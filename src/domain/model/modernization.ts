// What the user uploads
export type ArtifactKind =
  | "inventory_excel"
  | "architecture_current"
  | "architecture_future";

export interface Artifact {
  id: string;
  projectId: string;
  kind: ArtifactKind;
  filename: string;
  uploadedAt: string;
}

// Raw parsed rows from inventory Excel
export interface InventoryRow {
  systemName: string;
  vendor?: string;
  domainHint?: string;      // e.g. "DTC", "Supply Chain" from column or sheet
  dispositionRaw?: string;  // whatever the client used
  sourceRow: number;        // Excel row index for traceability
}

// Normalized logical app record (no DB yet, just TS)
export type Disposition =
  | "SUSTAIN"
  | "MODERNIZE"
  | "REPLACE"
  | "RETIRE"
  | "NEW"
  | "UNKNOWN";

export interface NormalizedApp {
  id: string;
  normalizedName: string;   // e.g. "DOMS"
  rawLabels: string[];      // "DOMS (Mail Service)", etc.
  vendor?: string;
  sourceKinds: ArtifactKind[]; // inventory vs diagram
  disposition?: Disposition;
}
