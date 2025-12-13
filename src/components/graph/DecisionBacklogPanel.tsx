"use client";

import type { DecisionNode } from "@/hooks/useDecisionBacklog";

type DecisionBacklogProps = {
  nodes: DecisionNode[];
  onSelect?: (node: DecisionNode) => void;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function calcAleScore(node: DecisionNode) {
  const roi = node.roi ?? 0;
  const tcc = node.tcc ?? 0;
  const roc = node.roc ?? 0;
  const stakeholderAvg =
    Object.values(node.stakeholder_support ?? {}).reduce((sum, value) => sum + value, 0) /
    Math.max(1, Object.keys(node.stakeholder_support ?? {}).length);
  return Number(((roi * 0.4) + (1 - tcc) * 0.3 + roc * 0.2 + stakeholderAvg * 0.1).toFixed(2));
}

export function DecisionBacklogPanel({ nodes, onSelect }: DecisionBacklogProps) {
  if (!nodes.length) return null;
  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Decision Backlog</p>
          <p className="text-sm text-neutral-600">Stakeholder influence + ROI/TCC weighting</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
        {nodes.map((node) => {
          const aleScore = calcAleScore(node);
          const topSupporter = Object.entries(node.stakeholder_support)
            .sort((a, b) => b[1] - a[1])[0];
          const topResistor = Object.entries(node.stakeholder_support)
            .sort((a, b) => a[1] - b[1])[0];
          return (
            <li
              key={node.id}
              className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-500 cursor-pointer"
              onClick={() => onSelect?.(node)}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-neutral-900">{node.title}</p>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                  ALE {Math.round(aleScore * 100)}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">{node.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem] text-neutral-500">
                <span>ROI {formatPercent(node.roi)}</span>
                <span>TCC {formatPercent(node.tcc)}</span>
                <span>ROC {formatPercent(node.roc)}</span>
                <span>Timeline {node.timeline}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem] text-neutral-500">
                {node.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-neutral-200 px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
              {topSupporter ? (
                <p className="mt-2 text-xs text-emerald-600">
                  👍 {topSupporter[0]} ({formatPercent((topSupporter[1] + 1) / 2)})
                </p>
              ) : null}
              {topResistor ? (
                <p className="text-xs text-rose-600">
                  ⚠️ {topResistor[0]} ({formatPercent((topResistor[1] + 1) / 2)})
                </p>
              ) : null}
            </li>
        );
      })}
      </ul>
    </section>
  );
}
