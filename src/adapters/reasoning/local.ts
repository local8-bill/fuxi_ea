// Local “reasoning” adapter. Simple, deterministic alignment logic for dev.
// Keeps a stable contract so we can swap to a proper model later.

import type { ReasoningPort } from "@/domain/ports/reasoning";
import type { Capability } from "@/domain/model/capability";

type AlignInput = {
  rows: Array<{ id?: string; name: string; level: "L1" | "L2" | "L3"; domain?: string; parent?: string }>;
  existingL1: string[];
};

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function score(a: string, b: string) {
  const A = new Set(norm(a).split(" "));
  const B = new Set(norm(b).split(" "));
  const inter = [...A].filter(x => B.has(x)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

export function makeLocalReasoning(): ReasoningPort & {
  align(input: AlignInput): Promise<{
    // minimal preview structure (safe for Labs)
    roots: Array<{ name: string; level: "L1" | "L2" | "L3"; domain?: string; parent?: string }>;
    issues: string[];
    suggestions: Record<string, string[]>; // name -> candidate L1s
  }>;
} {
  return {
    async suggestMappings(extractedNames: string[], existing: Capability[]) {
      const out: Array<{ sourceName: string; action: "new" | "merge" | "attach"; targetId?: string; reason?: string }> = [];
      for (const name of extractedNames) {
        // find best candidate among *all* nodes
        let best: { id: string; label: string; s: number } | null = null;
        const stack = [...existing];
        while (stack.length) {
          const n = stack.pop()!;
          const s = score(name, n.name);
          if (!best || s > best.s) best = { id: n.id, label: n.name, s };
          if (n.children?.length) stack.push(...n.children);
        }
        if (best && best.s >= 0.8) out.push({ sourceName: name, action: "merge", targetId: best.id, reason: `≈ ${best.label}` });
        else if (best && best.s >= 0.5) out.push({ sourceName: name, action: "attach", targetId: best.id, reason: `~ ${best.label}` });
        else out.push({ sourceName: name, action: "new" });
      }
      return out;
    },

    async align(input: AlignInput) {
      const roots = input.rows.filter(r => r.level === "L1");
      const issues: string[] = [];
      const suggestions: Record<string, string[]> = {};

      for (const r of roots) {
        // If the incoming L1 matches a known L1, surface that as a suggestion bucket.
        const candidates = input.existingL1
          .map(x => ({ x, s: score(r.name, x) }))
          .filter(z => z.s >= 0.4)
          .sort((a, b) => b.s - a.s)
          .slice(0, 3)
          .map(z => z.x);

        if (candidates.length) suggestions[r.name] = candidates;
        if (!r.domain) issues.push(`L1 "${r.name}" has no domain`);
      }

      return { roots, issues, suggestions };
    },
  };
}
