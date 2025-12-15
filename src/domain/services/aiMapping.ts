// src/domain/services/aiMapping.ts
export type Suggestion = {
  candidate: string;
  confidence: number;    // 0..1
  reasons?: string[];
};

export function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function similarity(a: string, b: string): number {
  const A = new Set(normalizeName(a).split(" ").filter(Boolean));
  const B = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (A.size === 0 || B.size === 0) return 0;

  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  const jaccard = union > 0 ? inter / union : 0;

  const na = normalizeName(a);
  const nb = normalizeName(b);
  const prefixBonus = na.startsWith(nb) || nb.startsWith(na) ? 0.15 : 0;
  const lengthPenalty = Math.max(0, 1 - Math.abs(na.length - nb.length) / 40) * 0.05;

  return Math.min(1, jaccard + prefixBonus + lengthPenalty);
}

export function suggestCapabilityMapping(
  inputName: string,
  candidates: string[],
  topN = 5
): Suggestion[] {
  const scored = candidates
    .map((c) => {
      const s = similarity(inputName, c);
      const reasons: string[] = [];
      if (normalizeName(inputName) === normalizeName(c)) reasons.push("exact-normalized");
      if (normalizeName(c).startsWith(normalizeName(inputName)) || normalizeName(inputName).startsWith(normalizeName(c))) reasons.push("prefix");
      if (s > 0.6) reasons.push("token-overlap");
      return { candidate: c, confidence: s, reasons };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);

  return scored;
}

export interface AiMappingPort {
  suggest(inputName: string, candidates: string[], topN?: number): Promise<Suggestion[]>;
}

export const localHeuristicAi: AiMappingPort = {
  async suggest(inputName, candidates, topN = 5) {
    return suggestCapabilityMapping(inputName, candidates, topN);
  },
};
