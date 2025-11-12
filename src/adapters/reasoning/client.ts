// src/adapters/reasoning/client.ts
import type {
  ReasoningPort,
  ReasoningAlignInput,
  ReasoningAlignResult,
  ReasoningSuggestion,
} from "@/domain/ports/reasoning";
import type { Capability } from "@/domain/model/capability";

/** simple normalizer + token overlap score */
function norm(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function score(a: string, b: string) {
  const A = new Set(norm(a).split(" ").filter(Boolean));
  const B = new Set(norm(b).split(" ").filter(Boolean));
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

/** best match across a capability tree */
function bestMatch(name: string, roots: Capability[]): { id: string; text: string; s: number } | null {
  let best: { id: string; text: string; s: number } | null = null;
  const stack = [...roots];
  while (stack.length) {
    const n = stack.pop()!;
    const s = score(name, n.name);
    if (!best || s > best.s) best = { id: n.id, text: n.name, s };
    if (n.children?.length) stack.push(...n.children);
  }
  return best;
}

/** Local reasoning fallback */
export function makeLocalReasoning(existingTree?: Capability[]): ReasoningPort {
  return {
    async align(input: ReasoningAlignInput): Promise<ReasoningAlignResult> {
      const issues: string[] = [];
      const suggestions: ReasoningSuggestion[] = [];

      for (const r of input.rows) {
        const nm = r.name?.trim();
        if (!nm) { issues.push("Row missing name"); continue; }

        if (r.level === "L1" && input.existingL1.some((x) => x.toLowerCase() === nm.toLowerCase())) {
          suggestions.push({ sourceName: nm, action: "merge", reason: "Exact L1 name exists" });
          continue;
        }

        if (existingTree) {
          const m = bestMatch(nm, existingTree);
          if (m && m.s >= 0.8) {
            suggestions.push({ sourceName: nm, action: "merge", targetId: m.id, reason: `≈ ${m.text}` });
            continue;
          } else if (m && m.s >= 0.5) {
            suggestions.push({ sourceName: nm, action: "attach", targetId: m.id, reason: `similar to ${m.text}` });
            continue;
          }
        }

        suggestions.push({ sourceName: nm, action: "new", reason: "no close match" });
      }

      return { suggestions, issues };
    },
  };
}

/** API-backed alignment with robust error handling */
export async function alignViaApi(
  rows: ReasoningAlignInput["rows"],
  existingL1: string[],
): Promise<ReasoningAlignResult> {
  const res = await fetch("/api/reasoning/align", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows, existingL1 }),
  });

  const text = await res.text(); // read once
  if (!res.ok) {
    // Try to extract server JSON error; otherwise show trimmed body (helps when HTML 404 leaks through)
    let msg = text;
    try {
      const j = JSON.parse(text);
      if (j?.error) msg = j.error;
    } catch { /* not JSON */ }
    msg = String(msg || "").slice(0, 400);
    throw new Error(`align failed: ${res.status} ${msg}`);
  }

  try {
    const json = JSON.parse(text);
    // Support either {ok:true,result:{...}} or direct result
    return (json?.result ?? json) as ReasoningAlignResult;
  } catch {
    throw new Error(`align failed: bad JSON from server (first 200 chars): ${text.slice(0, 200)}`);
  }
}
