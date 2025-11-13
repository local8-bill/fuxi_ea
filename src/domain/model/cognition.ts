// src/domain/model/cognition.ts

export type CognitionStage =
  | "ingest"        // raw structure sanity checks
  | "reconcile"     // cross-source reconciliation (spreadsheets vs diagrams etc.)
  | "infer"         // AI inferences + gaps
  | "score"         // strategic / risk / value scoring
  | "drift";        // time-based drift + misalignment

export type InsightSeverity = "info" | "warning" | "risk" | "opportunity";

export type InsightTag =
  | "structure"
  | "naming"
  | "depth"
  | "duplication"
  | "coverage"
  | "domain"
  | "data-quality"
  | "future-state"
  | "tech"
  | "people";

export interface CognitionInsight {
  id: string;
  stage: CognitionStage;
  severity: InsightSeverity;
  message: string;
  tags: InsightTag[];
  relatedCapabilityIds?: string[];
  meta?: Record<string, unknown>;
  createdAt: string; // ISO timestamp
}

export interface DepthStats {
  maxDepth: number;
  avgDepth: number;
  byDepth: Record<number, number>;
}

export interface CognitionSnapshot {
  capabilityCount: number;
  l1Count: number;
  l2Count: number;
  l3Count: number;
  l4PlusCount: number;
  distinctNames: number;
  duplicateNameCount: number;
  emptyNameCount: number;
  depth: DepthStats;
}

export interface CapabilityCognitionResult {
  snapshot: CognitionSnapshot;
  insights: CognitionInsight[];
}
