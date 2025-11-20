import { useMemo } from "react";
import { Card } from "@/components/ui/Card";

interface TruthPassPanelProps {
  projectId: string;
  inventorySystemsNorm: string[];
  inventoryDisplayByNorm: Record<string, string>;
  diagramSystems: {
    id: string;
    name: string;
    normalizedName: string;
    integrationCount: number;
  }[];
}

interface TruthPassSuggestion {
  inventoryNorm: string;
  inventoryLabel: string;
  diagramId?: string;
  diagramLabel?: string;
  confidence: number; // 0..1
}

/**
 * Very simple string similarity heuristic.
 * Not "real" AI yet, but good enough to drive a Truth Pass preview.
 */
function similarityScore(aRaw: string, bRaw: string): number {
  const a = aRaw.toLowerCase().trim();
  const b = bRaw.toLowerCase().trim();
  if (!a || !b) return 0;

  if (a === b) return 1;

  // Strip common noise
  const stripNoise = (s: string) =>
    s
      .replace(/system/gi, "")
      .replace(/platform/gi, "")
      .replace(/application/gi, "")
      .replace(/\s+/g, " ")
      .trim();

  const aa = stripNoise(a);
  const bb = stripNoise(b);

  if (!aa || !bb) return 0;

  if (aa === bb) return 0.95;

  if (aa.includes(bb) || bb.includes(aa)) return 0.9;

  const aTokens = aa.split(/[\s\-_/]+/).filter(Boolean);
  const bTokens = bb.split(/[\s\-_/]+/).filter(Boolean);
  if (!aTokens.length || !bTokens.length) return 0;

  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let overlap = 0;
  for (const t of aSet) {
    if (bSet.has(t)) overlap++;
  }

  const union = new Set([...aSet, ...bSet]).size || 1;
  const jaccard = overlap / union; // 0..1

  // Boost if first tokens match (e.g. "flex plm" vs "flex")
  const firstMatch = aTokens[0] === bTokens[0] ? 0.15 : 0;

  return Math.min(1, jaccard * 0.8 + firstMatch);
}

function confidenceLabel(score: number): { label: string; tone: "high" | "med" | "low" } {
  if (score >= 0.8) return { label: "High", tone: "high" };
  if (score >= 0.5) return { label: "Medium", tone: "med" };
  if (score >= 0.3) return { label: "Low", tone: "low" };
  return { label: "Weak", tone: "low" };
}

export function TruthPassPanel({
  projectId,
  inventorySystemsNorm,
  inventoryDisplayByNorm,
  diagramSystems,
}: TruthPassPanelProps) {
  const suggestions = useMemo<TruthPassSuggestion[]>(() => {
    const invNorms = (inventorySystemsNorm ?? []).filter((n) => n && n.trim().length > 0);
    const diagOnly = (diagramSystems ?? []).filter(
      (s) => s.normalizedName && s.normalizedName.trim().length > 0,
    );

    if (!invNorms.length || !diagOnly.length) return [];

    // Build quick lookup for diagram systems by normalized name
    const diagramByNorm = new Map<string, { label: string; id: string }[]>();
    for (const s of diagOnly) {
      const norm = s.normalizedName.toLowerCase();
      const arr = diagramByNorm.get(norm) ?? [];
      arr.push({
        id: s.id,
        label: s.name || s.normalizedName,
      });
      diagramByNorm.set(norm, arr);
    }

    const results: TruthPassSuggestion[] = [];

    for (const invNorm of invNorms) {
      const invLabel = inventoryDisplayByNorm[invNorm] || invNorm;
      const invKey = invNorm.toLowerCase();

      // Try exact normalized match first
      if (diagramByNorm.has(invKey)) {
        // These are already exact matches; we usually handle them in the core diff.
        // For Truth Pass we only want fuzzy / "are these really the same?" cases.
        continue;
      }

      // Fuzzy match against all diagram systems
      let best: { score: number; system?: { id: string; label: string } } = {
        score: 0,
        system: undefined,
      };

      for (const s of diagOnly) {
        const score = similarityScore(invLabel, s.name || s.normalizedName);
        if (score > best.score) {
          best = {
            score,
            system: { id: s.id, label: s.name || s.normalizedName },
          };
        }
      }

      if (!best.system) continue;

      // Only surface non-trivial matches
      if (best.score < 0.3) continue;

      results.push({
        inventoryNorm: invNorm,
        inventoryLabel: invLabel,
        diagramId: best.system.id,
        diagramLabel: best.system.label,
        confidence: best.score,
      });
    }

    // Sort best suggestions to the top
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // keep it readable
  }, [inventorySystemsNorm, inventoryDisplayByNorm, diagramSystems]);

  const hasData =
    (inventorySystemsNorm?.length ?? 0) > 0 && (diagramSystems?.length ?? 0) > 0;

  return (
    <Card className="mt-6">
      <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
        TRUTH PASS (PREVIEW)
      </p>
      <p className="text-xs text-gray-500 mb-4">
        Fuxi&apos;s first pass at lining up your inventory systems with the Lucid diagram
        for project <span className="font-medium">{projectId}</span>. Use this as a
        sanity check before trusting the diff.
      </p>

      {!hasData && (
        <p className="text-xs text-gray-500">
          Upload an inventory CSV and a Lucid CSV to generate Truth Pass suggestions.
        </p>
      )}

      {hasData && suggestions.length === 0 && (
        <p className="text-xs text-gray-500">
          No fuzzy matches to review yet. Either everything lines up nicely, or the
          naming is so different that Fuxi doesn&apos;t want to guess.
        </p>
      )}

      {hasData && suggestions.length > 0 && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 text-[0.7rem] font-medium text-gray-600">
            <div className="col-span-4 px-3 py-2">Inventory says…</div>
            <div className="col-span-4 px-3 py-2">Diagram says…</div>
            <div className="col-span-4 px-3 py-2">Fuxi confidence</div>
          </div>
          <ul className="max-h-72 overflow-auto text-xs divide-y divide-gray-100">
            {suggestions.map((s) => {
              const { label, tone } = confidenceLabel(s.confidence);
              const pct = Math.round(s.confidence * 100);
              const toneClass =
                tone === "high"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : tone === "med"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-gray-50 text-gray-600 border-gray-200";

              return (
                <li key={s.inventoryNorm + "::" + (s.diagramId ?? "none")}>
                  <div className="grid grid-cols-12 items-center px-3 py-2 gap-2">
                    <div className="col-span-4 truncate">
                      <span className="font-medium text-gray-900">
                        {s.inventoryLabel}
                      </span>
                    </div>
                    <div className="col-span-4 truncate">
                      {s.diagramLabel ? (
                        <span className="text-gray-800">{s.diagramLabel}</span>
                      ) : (
                        <span className="text-gray-400 italic">No candidate</span>
                      )}
                    </div>
                    <div className="col-span-4 flex items-center gap-2 justify-between">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] ${toneClass}`}
                      >
                        {label} · {pct}%
                      </span>
                      <span className="text-[0.65rem] text-gray-400">
                        (preview only – decisions not yet saved)
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
