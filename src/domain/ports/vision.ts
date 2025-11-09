export type VisionExtractOptions = {
  /** "table" | "bullets" | "mixed" — hints the layout, default "mixed" */
  layoutHint?: "table" | "bullets" | "mixed";
  /** optional organization vocab like ["Commerce","Core Ops"] */
  domainVocabulary?: string[];
};

export type ExtractedRow = {
  id?: string;           // if present in source
  name: string;          // "Order Management"
  level?: "L1" | "L2" | "L3";
  parent?: string;       // parent name (if known)
  domain?: string;       // guessed
};

export interface VisionPort {
  /** Accepts raw bytes (image/pdf). Returns normalized rows. */
  extract(bytes: ArrayBuffer, opts?: VisionExtractOptions): Promise<ExtractedRow[]>;
}