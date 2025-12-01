"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTelemetry } from "@/hooks/useTelemetry";

export type ReviewMetrics = {
  nodeCount: number;
  edgeCount: number;
  avgConfidence: number;
  added: number;
  removed: number;
  modified: number;
  domains: Array<{ name: string; count: number }>;
};

export type DeltaRow = {
  id: string;
  label: string;
  domain: string;
  state: "added" | "removed" | "modified" | "unchanged";
  confidence: number;
  sources?: string[];
};

export type DomainComparison = {
  domain: string;
  current: { count: number; nodes: Array<{ id: string; label: string }> };
  future: { count: number; nodes: Array<{ id: string; label: string }> };
  currentOnly: Array<{ id: string; label: string; domain: string }>;
  futureOnly: Array<{ id: string; label: string; domain: string }>;
  edges: { total: number; crossDomain: number };
};

type Props = {
  projectId: string;
  metrics: ReviewMetrics;
  deltaRows: DeltaRow[];
  domainComparisons: DomainComparison[];
};

const stateChip: Record<string, string> = {
  added: "bg-green-100 text-green-800",
  removed: "bg-rose-100 text-rose-800",
  modified: "bg-amber-100 text-amber-800",
  unchanged: "bg-slate-100 text-slate-700",
};

export function HarmonizationReviewClient({ projectId, metrics, deltaRows, domainComparisons }: Props) {
  const router = useRouter();
  const { log } = useTelemetry("harmonization_review", { projectId });
  const [busyId, setBusyId] = useState<string | null>(null);

  React.useEffect(() => {
    log("harmonization_preview_load", {
      nodeCount: metrics.nodeCount,
      edgeCount: metrics.edgeCount,
      avgConfidence: metrics.avgConfidence,
      added: metrics.added,
      removed: metrics.removed,
      modified: metrics.modified,
      domainCount: metrics.domains.length,
    });
  }, [log, metrics]);

  const handleConfirm = () => {
    log("harmonization_confirm", {
      nodeCount: metrics.nodeCount,
      edgeCount: metrics.edgeCount,
      avgConfidence: metrics.avgConfidence,
    });
    router.push(`/project/${projectId}/digital-enterprise`);
  };

  const handleReingest = () => {
    router.push(`/project/${projectId}/tech-stack`);
  };

  const handleMergeAlias = (row: DeltaRow) => {
    log("merge_alias", { system_id: row.id, label: row.label, domain: row.domain });
  };

  const handleDomainConfirm = (row: DeltaRow) => {
    log("domain_confirm", { system_id: row.id, domain: row.domain });
  };

  const handleKeepInFuture = async (item: { id: string; label: string; domain: string }) => {
    setBusyId(item.id);
    try {
      log("future_keep", { system_id: item.id, domain: item.domain });
      const res = await fetch("/api/harmonization/keep-in-future", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: item.id, label: item.label, domain: item.domain }),
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.warn("Failed to keep in future", await res.text());
      } else {
        router.refresh();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("keep in future failed", err);
    } finally {
      setBusyId(null);
    }
  };

  const lowConfidence = (c: number) => c < 0.6;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Harmonization Review</p>
        <h1 className="text-2xl font-bold text-slate-900">Validate the harmonized ecosystem before visualization</h1>
        <p className="mt-2 text-slate-600">
          Review systems, integrations, confidence, and deltas. Confirm to continue to the Digital Enterprise view.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Systems found" value={metrics.nodeCount} hint="Total harmonized systems across current + future" />
        <MetricCard label="Integrations" value={metrics.edgeCount} hint="Edge count after harmonization" />
        <MetricCard label="Avg confidence" value={metrics.avgConfidence.toFixed(3)} hint="Node-level confidence across sources" />
        <MetricCard
          label={`Added / Removed (net ${metrics.added - metrics.removed >= 0 ? "+" : ""}${metrics.added - metrics.removed})`}
          value={`${metrics.added} / ${metrics.removed}`}
          hint="Future-only vs current-only systems"
        />
        <MetricCard label="Domains detected" value={metrics.domains.length} hint="Distinct domains across all systems" />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current vs Future by Domain</h2>
            <p className="text-sm text-slate-600">
              Side-by-side counts and node names from current (inventory/Lucid) vs future uploads.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {domainComparisons.map((d) => (
            <div key={d.domain} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-slate-900">{d.domain}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                  <span className="rounded-full bg-slate-200 px-2 py-1 font-semibold">Current: {d.current.count}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-1 font-semibold">Future: {d.future.count}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-1 font-semibold">Edges: {d.edges.total}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-1 font-semibold">
                    Cross-domain: {d.edges.crossDomain}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-800">
                    {d.current.nodes.length ? (
                      d.current.nodes.map((n) => (
                        <span key={n.id} className="rounded-full bg-white px-2 py-1 shadow-sm">
                          {n.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Future</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-800">
                    {d.future.nodes.length ? (
                      d.future.nodes.map((n) => (
                        <span key={n.id} className="rounded-full bg-white px-2 py-1 shadow-sm">
                          {n.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </div>
                </div>
              </div>
              {(d.currentOnly.length > 0 || d.futureOnly.length > 0) && (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Current only (not in future — will be marked removed unless kept)
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-amber-900">
                    {d.currentOnly.length ? (
                      d.currentOnly.map((n) => (
                        <span key={n.id} className="inline-flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm">
                          <span>{n.label}</span>
                          <button
                            className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-200"
                            onClick={() => handleKeepInFuture(n)}
                            disabled={busyId === n.id}
                          >
                            {busyId === n.id ? "Saving..." : "Keep in future"}
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-amber-700">None</span>
                    )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                      Future only (new/added)
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-green-900">
                    {d.futureOnly.length ? (
                      d.futureOnly.map((n) => (
                        <span key={n.id} className="rounded-full bg-white px-2 py-1 shadow-sm">
                          {n.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-green-700">None</span>
                    )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Domain summary</h2>
            <p className="text-sm text-slate-600">Unique domains detected from harmonization output.</p>
          </div>
          <div className="text-xs text-slate-600">
            Unmapped systems are grouped under <span className="font-semibold">Other</span>.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {metrics.domains.map((d) => (
            <span
              key={d.name}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
            >
              <span className="font-semibold">{d.name}</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-800">{d.count}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Delta review</h2>
              <p className="text-sm text-slate-600">
                Added, removed, and modified systems (low-confidence rows highlighted).
              </p>
            </div>
            <div className="text-xs text-slate-600">Showing {deltaRows.length} entries ▾</div>
          </summary>
          <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">System</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deltaRows.map((row) => (
                  <tr
                    key={row.id}
                    className={lowConfidence(row.confidence) ? "bg-amber-50/60" : "bg-white"}
                  >
                    <td className="px-4 py-3 text-slate-900">{row.label}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stateChip[row.state] ?? ""}`}>
                        {row.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{row.domain}</td>
                    <td className="px-4 py-3 text-slate-800">{row.confidence.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {(row.sources && row.sources.length ? row.sources : ["Unknown"]).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                          onClick={() => handleMergeAlias(row)}
                        >
                          Merge alias
                        </button>
                        <button
                          className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                          onClick={() => handleDomainConfirm(row)}
                        >
                          Confirm domain
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Tip: Merge alias logs telemetry so we can refine matching; domain confirm logs validation feedback.
          </p>
        </details>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm text-slate-600">
          Ready to proceed? You can re-ingest if something looks off, or confirm to continue to Digital Enterprise.
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleReingest}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
          >
            ← Re-ingest
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Confirm harmonization → Digital Enterprise
          </button>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
