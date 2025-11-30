"use client";

import React from "react";
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

type Props = {
  projectId: string;
  metrics: ReviewMetrics;
  deltaRows: DeltaRow[];
};

const stateChip: Record<string, string> = {
  added: "bg-green-100 text-green-800",
  removed: "bg-rose-100 text-rose-800",
  modified: "bg-amber-100 text-amber-800",
  unchanged: "bg-slate-100 text-slate-700",
};

export function HarmonizationReviewClient({ projectId, metrics, deltaRows }: Props) {
  const router = useRouter();
  const { log } = useTelemetry("harmonization_review", { projectId });

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
        <MetricCard label="Systems found" value={metrics.nodeCount} />
        <MetricCard label="Integrations" value={metrics.edgeCount} />
        <MetricCard label="Avg confidence" value={metrics.avgConfidence.toFixed(3)} />
        <MetricCard label="Added / Removed" value={`${metrics.added} / ${metrics.removed}`} />
        <MetricCard label="Domains detected" value={metrics.domains.length} />
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
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Delta review</h2>
            <p className="text-sm text-slate-600">
              Added, removed, and modified systems. Low-confidence rows are highlighted for a closer look.
            </p>
          </div>
          <div className="text-xs text-slate-600">Showing {deltaRows.length} delta entries</div>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-200">
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
          Tip: Merge alias logs a telemetry event so we can refine matching; domain confirm logs validation feedback.
        </p>
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

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
