"use client";
import React from "react";
import type { Capability } from "@/domain/model/capability";
import { colorBand } from "@/domain/services/colorBand"; // from earlier step
import { compositeScore, type Weights } from "@/domain/services/scoring";

function MiniBar({ value01 }: { value01: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value01)) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-[rgba(229,231,235,.7)] overflow-hidden">
      <div className="h-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function CapabilityAccordionCard({
  cap,
  l1Score,
  weights,
  expanded,
  onToggle,
  onOpen,
  compositeFor,
}: {
  cap: Capability;         // L1 node
  l1Score: number;         // precomputed for band
  weights: Weights;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
  compositeFor: (cap: Capability) => number;
}) {
  const band = colorBand(l1Score);
  const l2s = cap.children ?? [];

  return (
    <div
      className={`card transition hover:shadow-md ${band.band}`}
      style={{ borderWidth: 1 }}
    >
      {/* L1 header */}
      <div className="flex items-start gap-3">
        <button
          className="btn"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "▾" : "▸"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{cap.name}</div>
          {cap.domain && (
            <div className="text-xs opacity-70 mt-1">{cap.domain}</div>
          )}
          {/* L1 progress */}
          <div className="mt-3">
            <MiniBar value01={l1Score} />
          </div>
        </div>

        <button
          className="badge"
          title="Open details"
          onClick={() => onOpen(cap.id)}
        >
          {Math.round(l1Score * 100)}/100
        </button>
      </div>

      {/* L2 list */}
      {expanded && l2s.length > 0 && (
        <div className="mt-4 space-y-2">
          {l2s.map((l2) => {
            const l2Score = l2.children?.length
              ? // derive from children if present
                (l2.children
                  .map((c) =>
                    c.children?.length
                      ? // compute for deeper nodes via compositeFor
                        compositeFor(c)
                      : compositeScore(c.scores ?? {}, weights)
                  )
                  .reduce((a, b) => a + b, 0) /
                  (l2.children.length || 1))
              : compositeScore(l2.scores ?? {}, weights);

            const [showL3, setShowL3] = React.useState(false);
            const hasL3 = (l2.children?.length ?? 0) > 0;

            return (
              <div key={l2.id} className="border border-slate-200 rounded-lg p-2 bg-white">
                <div className="flex items-center gap-2">
                  {hasL3 ? (
                    <button className="btn" onClick={() => setShowL3((v) => !v)} title={showL3 ? "Hide L3" : "Show L3"}>
                      {showL3 ? "▾" : "▸"}
                    </button>
                  ) : (
                    <span className="btn" aria-hidden>•</span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l2.name}</div>
                    <div className="mt-2">
                      <MiniBar value01={l2Score} />
                    </div>
                  </div>

                  <button className="badge" onClick={() => onOpen(l2.id)}>
                    {Math.round(l2Score * 100)}/100
                  </button>
                </div>

                {/* L3 inline */}
                {showL3 && hasL3 && (
                  <div className="mt-2 pl-8 space-y-2">
                    {l2.children!.map((l3) => {
                      const s =
                        l3.children?.length
                          ? compositeFor(l3)
                          : compositeScore(l3.scores ?? {}, weights);
                      return (
                        <div key={l3.id} className="flex items-center gap-2">
                          <span className="opacity-40">↳</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{l3.name}</div>
                            <div className="mt-2">
                              <MiniBar value01={s} />
                            </div>
                          </div>
                          <button className="badge" onClick={() => onOpen(l3.id)}>
                            {Math.round(s * 100)}/100
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}