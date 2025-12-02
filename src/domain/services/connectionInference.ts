import type { HarmonizedGraph, HarmonizedSystem } from "./harmonization";

export type ConnectionSuggestion = {
  id: string;
  source: string;
  target: string;
  confidence: number;
  reason: string;
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const inter = Array.from(aTokens).filter((t) => bTokens.has(t)).length;
  const union = new Set([...aTokens, ...bTokens]).size || 1;
  return inter / union;
}

function domainAffinity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0;
  if (a === b) return 0.2;
  return 0;
}

export function inferConnections(graph: HarmonizedGraph, threshold = 0.6): ConnectionSuggestion[] {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];
  const existing = new Set(edges.map((e) => `${e.source}->${e.target}`));

  const normCache = new Map<string, string>();
  const getNorm = (n: HarmonizedSystem) => {
    const cached = normCache.get(n.id);
    if (cached) return cached;
    const norm = normalizeName(n.label || n.system_name || n.id);
    normCache.set(n.id, norm);
    return norm;
  };

  const suggestions: ConnectionSuggestion[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const normA = getNorm(a);
      const normB = getNorm(b);
      const nameScore = jaccard(normA, normB);
      const domainScore = domainAffinity(a.domain, b.domain);
      const statePenalty = a.state !== "unchanged" || b.state !== "unchanged" ? 0.05 : 0;
      const confidence = Math.max(0, Math.min(1, nameScore * 0.6 + domainScore + statePenalty));
      if (confidence < threshold) continue;
      const id = `${a.id}->${b.id}`;
      if (existing.has(id)) continue;
      suggestions.push({
        id,
        source: a.id,
        target: b.id,
        confidence: Number(confidence.toFixed(2)),
        reason: buildReason(nameScore, domainScore),
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function buildReason(nameScore: number, domainScore: number): string {
  const reasons: string[] = [];
  if (nameScore >= 0.5) reasons.push("Similar naming");
  if (domainScore > 0) reasons.push("Shared domain");
  if (!reasons.length) reasons.push("Co-occurrence heuristic");
  return reasons.join(" + ");
}
