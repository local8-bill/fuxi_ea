// src/domain/services/cognition.ts
import type { Capability } from "@/domain/model/capability";

export type CognitionCapabilitySnapshot = {
  totalNodes: number;
  byLevel: Record<string, number>;
  leafCount: number;
  maxDepth: number;
};

export type CognitionInsight = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type CognitionResult = {
  snapshot: CognitionCapabilitySnapshot;
  insights: CognitionInsight[];
};

/**
 * Walk the L1–L3 (or deeper) tree and compute:
 * - basic counts
 * - depth
 * - by-level stats (if `level` is present)
 * - a few simple structural insights (duplicates, shallow trees, etc.)
 */
export function analyzeCapabilitiesStructure(roots: Capability[]): CognitionResult {
  const byLevel: Record<string, number> = {};
  let totalNodes = 0;
  let leafCount = 0;
  let maxDepth = 0;

  // for duplicate detection (case-insensitive)
  const nameCounts = new Map<string, { name: string; count: number }>();

  const stack: Array<{ node: Capability; depth: number }> = [];

  for (const r of roots ?? []) {
    stack.push({ node: r, depth: 1 });
  }

  while (stack.length) {
    const { node, depth } = stack.pop()!;
    totalNodes += 1;

    const name = (node.name ?? "").trim();
    if (name) {
      const key = name.toLowerCase();
      const entry = nameCounts.get(key) ?? { name, count: 0 };
      entry.count += 1;
      nameCounts.set(key, entry);
    }

    const level = (node as any).level as string | undefined;
    if (level) {
      byLevel[level] = (byLevel[level] ?? 0) + 1;
    }

    maxDepth = Math.max(maxDepth, depth);

    const kids = (node.children ?? []) as Capability[];
    if (!kids.length) {
      leafCount += 1;
    } else {
      for (const child of kids) {
        stack.push({ node: child, depth: depth + 1 });
      }
    }
  }

  const snapshot: CognitionCapabilitySnapshot = {
    totalNodes,
    byLevel,
    leafCount,
    maxDepth,
  };

  const insights: CognitionInsight[] = [];

  // Insight: empty or tiny trees
  if (totalNodes === 0) {
    insights.push({
      code: "empty_tree",
      severity: "warning",
      message: "No capabilities detected in the structure.",
    });
  } else if (totalNodes < 5) {
    insights.push({
      code: "very_small_tree",
      severity: "info",
      message: `Only ${totalNodes} capabilities detected — this looks like a minimal or test map.`,
    });
  }

  // Insight: duplicate names (case-insensitive)
  const dupes = [...nameCounts.values()].filter((e) => e.count > 1);
  if (dupes.length) {
    insights.push({
      code: "duplicate_names",
      severity: "warning",
      message: `Detected ${dupes.length} duplicate capability name(s).`,
      details: {
        duplicates: dupes.map((d) => ({ name: d.name, count: d.count })),
      },
    });
  }

  // Insight: very shallow tree
  if (maxDepth <= 1 && totalNodes > 0) {
    insights.push({
      code: "flat_structure",
      severity: "info",
      message:
        "Capability map is essentially flat (no deeper than L1). Consider modeling L2–L3 for more useful analysis.",
    });
  }

  // Insight: leaf ratio (are almost all nodes leaves?)
  if (totalNodes > 0) {
    const leafRatio = leafCount / totalNodes;
    if (leafRatio > 0.85 && maxDepth > 1) {
      insights.push({
        code: "mostly_leaves",
        severity: "info",
        message: `About ${(leafRatio * 100).toFixed(
          1,
        )}% of nodes are leaves — hierarchy may be too sparse.`,
        details: { leafRatio },
      });
    }
  }

  return { snapshot, insights };
}
