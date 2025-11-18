/**
 * Digital Enterprise normalization helpers (v1).
 *
 * Goal:
 * - Clean raw labels from Lucid
 * - Classify obvious non-systems so stats don't treat regions / shapes / lanes as systems
 */

export type NodeKind = "system" | "region" | "process" | "ui" | "shape" | "other";

export function normalizeLabel(raw: unknown): string {
  if (raw == null) return "";
  let s = String(raw).trim();

  // Strip surrounding quotes repeatedly, in case of \"...\" nesting
  while ((s.startsWith('"') || s.startsWith("'")) && s.length > 1) {
    s = s.slice(1).trim();
  }
  while ((s.endsWith('"') || s.endsWith("'")) && s.length > 1) {
    s = s.slice(0, -1).trim();
  }

  // Collapse internal whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}

/**
 * Classify a label into a coarse node kind.
 * v1 deliberately conservative: default is "system" unless it's clearly not.
 */
export function classifyLabel(label: string): NodeKind {
  const normalized = normalizeLabel(label);
  const l = normalized.toLowerCase();

  if (!l) return "other";

  // Region / geo / organizational buckets
  const regionKeywords = [
    "emea",
    "apac",
    "amer",
    "latam",
    "na",
    "north america",
    "south america",
    "europe",
    "asia",
    "regional",
    "region",
    "global",
    "worldwide",
  ];
  if (regionKeywords.some((k) => l === k || l.includes(k))) {
    return "region";
  }

  // Generic Lucid shape names / non-system primitives
  const shapeKeywords = [
    "text",
    "line",
    "process",
    "connector",
    "rectangle",
    "terminator",
    "cloud",
    "page",
    "user image",
    "block",
    "note",
  ];
  if (shapeKeywords.some((k) => l === k || l.includes(k))) {
    return "shape";
  }

  // Swimlanes / lanes / UI container metaphors
  if (l.includes("swimlane") || l.includes("lane")) {
    return "ui";
  }

  // Obvious process-style phrases (keep this conservative)
  const processKeywords = [
    "process",
    "workflow",
    "journey",
    "step",
    "stage",
    "phase",
  ];
  if (processKeywords.some((k) => l.includes(k))) {
    return "process";
  }

  // Pure numbers aren't useful system labels
  if (/^\d+$/.test(normalized)) {
    return "other";
  }

  // Some very specific junk we saw in this diagram
  const junkPatterns = [
    "pb - 1 or more", // "Sale PB - 1 or More"
  ];
  if (junkPatterns.some((k) => l.includes(k))) {
    return "other";
  }

  // Default assumption: it's a real system
  return "system";
}
