// src/ui/components/CapabilityAccordionCard.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Capability } from "@/domain/model/capability";
import type { Weights } from "@/domain/services/scoring";

type Props = {
  cap: Capability;                // L1 node (with optional children)
  l1Score: number;                // precomputed composite for L1
  weights: Weights;
  expanded: boolean;              // whether L1 accordion is open
  onToggle: () => void;           // toggle L1 open/closed
  onOpen: (id: string) => void;   // open scoring drawer for any node (L1/2/3)
  compositeFor: (cap: Capability) => number; // compute composite for any node
  aiEnabled?: boolean;
  onAiAssist?: (id: string) => void;
  onInlineEdit?: (id: string, patch: { name?: string; domain?: string }) => void;
  onScoreChip?: (id: string, score: number) => void;
};

export function CapabilityAccordionCard({
  cap,
  l1Score,
  weights,           // eslint: unused but future-proof
  expanded,
  onToggle,
  onOpen,
  compositeFor,
  aiEnabled = false,
  onAiAssist,
  onInlineEdit,
  onScoreChip,
}: Props) {
  const schema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(1, "Name is required"),
        domain: z.string().optional(),
      }),
    []
  );
  const { register, handleSubmit, watch } = useForm<{ name: string; domain?: string }>({
    resolver: zodResolver(schema),
    defaultValues: { name: cap.name, domain: cap.domain ?? "" },
  });

  const onSubmit = handleSubmit((values) => {
    onInlineEdit?.(cap.id, { name: values.name.trim(), domain: values.domain?.trim() || undefined });
  });

  const nameVal = watch("name");
  const domainVal = watch("domain");

  // map 0..1 to our soft “band” classes
  const band = (s: number) =>
    s >= 0.75 ? "band-high"
    : s >= 0.5 ? "band-med"
    : "band-low";

  return (
    <div className={`card ${band(l1Score)}`} style={{ borderWidth: 1 }}>
      {/* L1 header row */}
      <div className="flex items-start gap-3">
        <button
          className="btn"
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>

        <div className="flex-1">
          <form onBlur={onSubmit} onSubmit={onSubmit}>
            <div className="flex items-center justify-between gap-3">
              <input
                className="w-full border border-slate-200 rounded-md px-2 py-1 text-sm font-semibold"
                {...register("name")}
                defaultValue={cap.name}
                aria-label="Capability name"
              />
              <div className="badge" title={`Composite: ${(l1Score * 100).toFixed(0)}%`}>
                {(l1Score * 100).toFixed(0)}%
              </div>
            </div>
            <input
              className="mt-1 w-full border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700"
              {...register("domain")}
              defaultValue={cap.domain}
              placeholder="Domain (optional)"
              aria-label="Capability domain"
            />
          </form>
        </div>

        <div className="flex gap-2">
          {aiEnabled && onAiAssist && (
            <button className="btn" onClick={() => onAiAssist(cap.id)}>
              AI Assist
            </button>
          )}
          <button className="btn" onClick={() => onOpen(cap.id)}>Score</button>
        </div>
      </div>

      {/* L2 / L3 body */}
      {expanded && (
        <div style={{ marginTop: 12 }}>
          {(!cap.children || cap.children.length === 0) ? (
            <div className="text-sm" style={{ opacity: 0.7 }}>
              No L2 sub-capabilities yet.
            </div>
          ) : (
            <div className="grid gap-2">
              {cap.children!.map((l2) => (
                <L2Row
                  key={l2.id}
                  cap={l2}
                  onOpen={onOpen}
                  compositeFor={compositeFor}
                  aiEnabled={aiEnabled}
                  onAiAssist={onAiAssist}
                  onInlineEdit={onInlineEdit}
                  onScoreChip={onScoreChip}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function L2Row({
  cap,
  onOpen,
  compositeFor,
  aiEnabled,
  onAiAssist,
  onInlineEdit,
  onScoreChip,
}: {
  cap: Capability;
  onOpen: (id: string) => void;
  compositeFor: (cap: Capability) => number;
  aiEnabled?: boolean;
  onAiAssist?: (id: string) => void;
  onInlineEdit?: (id: string, patch: { name?: string; domain?: string }) => void;
  onScoreChip?: (id: string, score: number) => void;
}) {
  const s = safeScore(cap, compositeFor);
  const bandCls = s >= 0.75 ? "band-high" : s >= 0.5 ? "band-med" : "band-low";

  return (
    <div className={`card ${bandCls}`} style={{ padding: 8 }}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="font-medium">{cap.name}</div>
            <div className="badge" title={`Composite: ${(s * 100).toFixed(0)}%`}>
              {(s * 100).toFixed(0)}%
            </div>
          </div>
          <div className="mt-2 flex gap-1 text-xs">
            {[
              { label: "Gap", v: 0.25, color: "#ef4444" },
              { label: "Neutral", v: 0.5, color: "#eab308" },
              { label: "Strong", v: 0.85, color: "#22c55e" },
            ].map((chip) => (
              <button
                key={chip.label}
                className="fx-pill"
                style={{ background: `${chip.color}22`, borderColor: `${chip.color}44` }}
                onClick={() => onScoreChip?.(cap.id, chip.v)}
                aria-label={`Set score ${chip.label}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {aiEnabled && onAiAssist && (
            <button className="btn" onClick={() => onAiAssist(cap.id)}>
              AI Assist
            </button>
          )}
          <button className="btn" onClick={() => onOpen(cap.id)}>Score</button>
        </div>
      </div>

      {/* L3 list */}
      {cap.children && cap.children.length > 0 && (
        <ul style={{ marginTop: 6, paddingLeft: 12 }}>
          {cap.children.map((l3) => (
            <L3Row
              key={l3.id}
              cap={l3}
              onOpen={onOpen}
              compositeFor={compositeFor}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function L3Row({
  cap,
  onOpen,
  compositeFor,
  aiEnabled,
  onAiAssist,
  onScoreChip,
}: {
  cap: Capability;
  onOpen: (id: string) => void;
  compositeFor: (cap: Capability) => number;
  aiEnabled?: boolean;
  onAiAssist?: (id: string) => void;
  onScoreChip?: (id: string, score: number) => void;
}) {
  const s = safeScore(cap, compositeFor);
  const bandCls = s >= 0.75 ? "band-high" : s >= 0.5 ? "band-med" : "band-low";

  return (
    <li className={`card ${bandCls}`} style={{ padding: 6, display: "flex", alignItems: "center", gap: 8 }}>
      <span className="text-sm" style={{ flex: 1 }}>{cap.name}</span>
      <span className="badge" title={`Composite: ${(s * 100).toFixed(0)}%`}>
        {(s * 100).toFixed(0)}%
      </span>
      <div className="flex gap-2 items-center">
        <div className="flex gap-1">
          {[
            { label: "Gap", v: 0.25, color: "#ef4444" },
            { label: "Neutral", v: 0.5, color: "#eab308" },
            { label: "Strong", v: 0.85, color: "#22c55e" },
          ].map((chip) => (
            <button
              key={chip.label}
              className="fx-pill"
              style={{ background: `${chip.color}22`, borderColor: `${chip.color}44` }}
              onClick={() => onScoreChip?.(cap.id, chip.v)}
              aria-label={`Set score ${chip.label}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
        {aiEnabled && onAiAssist && (
          <button className="btn" onClick={() => onAiAssist(cap.id)}>
            AI
          </button>
        )}
        <button className="btn" onClick={() => onOpen(cap.id)}>Score</button>
      </div>
    </li>
  );
}

/** If a node has no scores, compute composite from its children. If leaf & no scores, return 0. */
function safeScore(cap: Capability, compositeFor: (c: Capability) => number): number {
  try {
    const v = compositeFor(cap);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}
