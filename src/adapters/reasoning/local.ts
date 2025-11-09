import type { ReasoningPort, ReasoningSuggestion } from "@/domain/ports/reasoning";
import type { Capability } from "@/domain/model/capability";

function norm(s: string){ return s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim(); }
function score(a: string, b: string){
  const A = new Set(norm(a).split(" ")); const B = new Set(norm(b).split(" "));
  const inter = [...A].filter(x=>B.has(x)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

export const localReasoningAdapter: ReasoningPort = {
  async suggestMappings(extractedNames: string[], existing: Capability[]): Promise<ReasoningSuggestion[]> {
    const suggestions: ReasoningSuggestion[] = [];
    for (const name of extractedNames) {
      // find best match among all levels
      let best: { id:string; n:string; s:number } | null = null;

      const stack = [...existing];
      while (stack.length) {
        const n = stack.pop()!;
        const s = score(name, n.name);
        if (!best || s > best.s) best = { id: n.id, n: n.name, s };
        if (n.children?.length) stack.push(...n.children);
      }

      if (best && best.s >= 0.8) {
        suggestions.push({ sourceName: name, action: "merge", targetId: best.id, reason: `name≈ (${best.n})` });
      } else if (best && best.s >= 0.5) {
        suggestions.push({ sourceName: name, action: "attach", targetId: best.id, reason: `similar to ${best.n}` });
      } else {
        suggestions.push({ sourceName: name, action: "new", reason: "no close match" });
      }
    }
    return suggestions;
  }
};