"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTelemetry } from "@/hooks/useTelemetry";

export type TransformationItem = {
  id: string;
  label: string;
  domain: string;
  state: "added" | "removed" | "modified" | "unchanged";
  confidence: number;
  sources?: string[];
};

type ActionType = "replace" | "modernize" | "retire" | "rename" | "keep";
type Effort = "low" | "medium" | "high";

type Selection = {
  action: ActionType | null;
  mappedSystem?: string;
  effort?: Effort;
  timelineMonths?: number;
};

type Props = {
  projectId: string;
  items: TransformationItem[];
};

type SummaryRow = {
  domain: string;
  counts: Record<ActionType, number>;
  total: number;
};

const actionLabels: Record<ActionType, string> = {
  replace: "Replace",
  modernize: "Modernize",
  retire: "Retire",
  rename: "Rename / Consolidate",
  keep: "Keep as-is",
};

const effortLabels: Record<Effort, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function TransformationDialogueClient({ projectId, items }: Props) {
  const router = useRouter();
  const { log } = useTelemetry("transformation_dialogue", { projectId });
  const [selections, setSelections] = React.useState<Record<string, Selection>>({});
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    log("transformation_dialogue_load", {
      system_count: items.length,
      domain_count: new Set(items.map((i) => i.domain)).size,
    });
  }, [items, log]);

  const handleAction = (id: string, action: ActionType) => {
    setSelections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        action,
      },
    }));
    const item = items.find((i) => i.id === id);
    log("transformation_action_select", {
      system_id: id,
      label: item?.label,
      action_type: action,
      confidence: item?.confidence,
    });
  };

  const handleDetailChange = (id: string, detail: Partial<Selection>) => {
    setSelections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...detail,
      },
    }));
  };

  const summary: SummaryRow[] = React.useMemo(() => {
    const buckets = new Map<string, SummaryRow>();
    for (const item of items) {
      const sel = selections[item.id];
      const action = sel?.action ?? "keep";
      const row = buckets.get(item.domain) ?? {
        domain: item.domain,
        counts: { replace: 0, modernize: 0, retire: 0, rename: 0, keep: 0 },
        total: 0,
      };
      row.counts[action] += 1;
      row.total += 1;
      buckets.set(item.domain, row);
    }
    return Array.from(buckets.values()).sort((a, b) => b.total - a.total);
  }, [items, selections]);

  const modernizationRatio = React.useMemo(() => {
    const total = items.length || 1;
    const modernizeCount = Object.values(selections).filter((s) => s.action === "modernize").length;
    return modernizeCount / total;
  }, [items.length, selections]);

  const avgEffort = React.useMemo(() => {
    const values: number[] = [];
    Object.values(selections).forEach((s) => {
      if (s.effort === "low") values.push(1);
      else if (s.effort === "medium") values.push(2);
      else if (s.effort === "high") values.push(3);
    });
    if (!values.length) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg < 1.5) return "Low";
    if (avg < 2.5) return "Medium";
    return "High";
  }, [selections]);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = Object.entries(selections).map(([id, sel]) => {
        const item = items.find((i) => i.id === id);
        return {
          system_id: id,
          label: item?.label ?? id,
          domain: item?.domain ?? "Other",
          state: item?.state ?? "unchanged",
          confidence: item?.confidence ?? 0,
          sources: item?.sources ?? [],
          action: sel.action ?? "keep",
          mapped_system: sel.mappedSystem ?? "",
          effort: sel.effort ?? null,
          timeline_months: sel.timelineMonths ?? null,
        };
      });

      const res = await fetch("/api/transformation-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, actions: payload }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to save transformation plan");
      }
      log("transformation_plan_confirm", {
        system_count: items.length,
        modernization_ratio: modernizationRatio,
        avg_effort: avgEffort,
      });
      router.push(`/project/${projectId}/digital-enterprise`);
    } catch (err: any) {
      setError(err?.message || "Failed to save transformation plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Transformation Dialogue</p>
        <h1 className="text-2xl font-bold text-slate-900">Define what each change means for your enterprise</h1>
        <p className="mt-2 text-slate-600">
          Review harmonization deltas, choose actions, and generate a transformation plan for leadership.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Metric label="Systems in scope" value={items.length} />
        <Metric label="Modernization ratio" value={`${Math.round(modernizationRatio * 100)}%`} />
        <Metric label="Avg. effort" value={avgEffort ?? "—"} />
      </section>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Delta feed</h2>
            <p className="text-sm text-slate-600">Added, removed, and modified systems grouped by domain.</p>
          </div>
          <div className="text-xs text-slate-600">Select an action and optionally map/estimate effort.</div>
        </div>

        <div className="space-y-4">
          {groupByDomain(items).map(({ domain, systems }) => (
            <div key={domain} className="rounded-xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                <div className="text-sm font-semibold text-slate-800">{domain}</div>
                <div className="text-xs text-slate-600">{systems.length} systems</div>
              </div>
              <div className="divide-y divide-slate-100">
                {systems.map((sys) => {
                  const sel = selections[sys.id] ?? { action: null };
                  return (
                    <div key={sys.id} className="grid gap-3 px-4 py-3 md:grid-cols-4 md:items-center">
                      <div className="md:col-span-1">
                        <div className="font-semibold text-slate-900">{sys.label}</div>
                        <div className="text-xs text-slate-600">
                          State: {sys.state} · Confidence: {sys.confidence.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        {(Object.keys(actionLabels) as ActionType[]).map((action) => (
                          <button
                            key={action}
                            onClick={() => handleAction(sys.id, action)}
                            className={
                              "rounded-full border px-3 py-1 text-xs font-semibold " +
                              (sel.action === action
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50")
                            }
                          >
                            {actionLabels[action]}
                          </button>
                        ))}
                      </div>
                      <div className="space-y-2 md:col-span-1">
                        <input
                          type="text"
                          placeholder="Mapped / new system"
                          value={sel.mappedSystem ?? ""}
                          onChange={(e) => handleDetailChange(sys.id, { mappedSystem: e.target.value })}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(effortLabels) as Effort[]).map((eff) => (
                            <button
                              key={eff}
                              onClick={() => handleDetailChange(sys.id, { effort: eff })}
                              className={
                                "rounded-full border px-2 py-1 text-[11px] font-semibold " +
                                (sel.effort === eff
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-50")
                              }
                            >
                              {effortLabels[eff]}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min={0}
                          placeholder="Timeline (months)"
                          value={sel.timelineMonths ?? ""}
                          onChange={(e) =>
                            handleDetailChange(sys.id, { timelineMonths: e.target.value ? Number(e.target.value) : undefined })
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Transformation summary</h2>
          <p className="text-sm text-slate-600">Aggregated actions by domain. Adjust selections above to update.</p>
        </div>
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Replace</th>
                <th className="px-4 py-3">Modernize</th>
                <th className="px-4 py-3">Retire</th>
                <th className="px-4 py-3">Rename</th>
                <th className="px-4 py-3">Keep</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((row) => (
                <tr key={row.domain} className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.domain}</td>
                  <td className="px-4 py-3 text-slate-800">{row.counts.replace}</td>
                  <td className="px-4 py-3 text-slate-800">{row.counts.modernize}</td>
                  <td className="px-4 py-3 text-slate-800">{row.counts.retire}</td>
                  <td className="px-4 py-3 text-slate-800">{row.counts.rename}</td>
                  <td className="px-4 py-3 text-slate-800">{row.counts.keep}</td>
                  <td className="px-4 py-3 text-slate-900">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm text-slate-600">
          When ready, confirm to generate the transformation plan and continue to Digital Enterprise.
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push(`/project/${projectId}/harmonization-review`)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            ← Back to Harmonization Review
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className={
              "rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 " +
              (saving ? "opacity-70" : "")
            }
          >
            {saving ? "Saving..." : "Confirm & Generate →"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function groupByDomain(items: TransformationItem[]) {
  const map = new Map<string, TransformationItem[]>();
  items.forEach((item) => {
    const list = map.get(item.domain) ?? [];
    list.push(item);
    map.set(item.domain, list);
  });
  return Array.from(map.entries())
    .map(([domain, systems]) => ({ domain, systems }))
    .sort((a, b) => b.systems.length - a.systems.length);
}
