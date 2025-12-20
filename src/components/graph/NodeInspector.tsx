"use client";

import clsx from "clsx";
import learningCorpus from "@/data/ale/learning_corpus.json";

type CorpusEntry = {
  tag: string;
  occurrences: number;
  average_risk: number;
  recommendation_strength: number;
  recommendation?: string;
};

const corpus = (learningCorpus as CorpusEntry[]) ?? [];
const corpusMap = new Map(corpus.map((entry) => [entry.tag, entry]));

function riskToState(value?: number) {
  if (typeof value !== "number") return { label: "Unknown", className: "text-slate-500" };
  if (value >= 0.75) return { label: "High", className: "text-rose-600" };
  if (value >= 0.5) return { label: "Medium", className: "text-amber-600" };
  return { label: "Low", className: "text-emerald-600" };
}

type IntegrationSummary = {
  flow_id: string;
  system_from: string;
  system_to: string;
  status?: string;
  env?: string;
  latency_ms?: number;
  error_rate?: number;
  direction?: "source" | "target";
};

export type NodeInspectorProps = {
  nodeName?: string | null;
  domain?: string | null;
  tags?: string[] | null;
  integrations?: IntegrationSummary[] | null;
  subcomponents?: string[] | null;
};

export function NodeInspector({ nodeName, domain, tags, integrations, subcomponents }: NodeInspectorProps) {
  const primaryName = nodeName ?? "No node selected";
  const tagEntries = (tags ?? []).map((tag) => ({ tag, corpus: corpusMap.get(tag) }));
  const highestRisk = tagEntries
    .map((entry) => entry.corpus?.average_risk ?? null)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0];
  const state = riskToState(highestRisk);
  const recentInsights = tagEntries
    .map((entry) => entry.corpus)
    .filter((entry): entry is CorpusEntry => Boolean(entry))
    .slice(0, 2);

  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-neutral-500">Node Inspector</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900">{primaryName}</p>
      {domain ? <p className="text-xs text-neutral-500">Domain · {domain}</p> : null}

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">ALE Reasoning Context</p>
        {tagEntries.length ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {tagEntries.map((entry) => (
              <li key={entry.tag} className="flex items-center justify-between">
                <span>{entry.tag}</span>
                {entry.corpus ? (
                  <span className="text-[0.7rem] text-slate-500">{entry.corpus.occurrences} events</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No ALE tags attached.</p>
        )}
        <p className={clsx("mt-3 text-sm font-semibold", state.className)}>Risk: {state.label}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Recent Insights</p>
        {recentInsights.length ? (
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {recentInsights.map((entry) => (
              <li key={entry.tag}>
                <p className="font-semibold">{entry.tag}</p>
                {entry.recommendation ? <p className="text-xs text-slate-500">{entry.recommendation}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No learning events yet.</p>
        )}
      </div>

      {subcomponents?.length ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Architecture modules</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {subcomponents.map((module, idx) => (
              <span key={`${primaryName}-module-${idx}`} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.65rem] font-medium text-neutral-700">
                {module}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {integrations?.length ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">Integration telemetry</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {integrations.slice(0, 3).map((flow) => (
              <li key={`${flow.flow_id}-${flow.direction ?? "both"}`}>
                <p className="font-semibold">
                  {flow.direction === "source" ? "→" : flow.direction === "target" ? "←" : "↔"} {flow.direction === "source" ? flow.system_to : flow.system_from}
                </p>
                <p className="text-xs text-slate-500">
                  {flow.env ?? "prod"} · {flow.status ?? "unknown"} · Lat {Math.round(flow.latency_ms ?? 0)}ms · Errors{" "}
                  {typeof flow.error_rate === "number" ? `${(flow.error_rate * 100).toFixed(1)}%` : "—"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
