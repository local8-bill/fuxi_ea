"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { ROIChart } from "@/components/ROIChart";
import { useTelemetry } from "@/hooks/useTelemetry";

interface DomainROIData {
  domain: string;
  months: number[];
  cost: number[];
  benefit: number[];
  roi: number[];
  breakEvenMonth: number | null;
}

interface SpendBucket {
  label: string;
  cost: number;
  benefit: number;
}

interface PeoplePlanEntry {
  label: string;
  fte: number;
  note: string;
}

interface ReplacementRow {
  name: string;
  breakEven: string;
  savings: string;
}

interface FinancialForecast {
  timeline: { month: number; cost: number; benefit: number; roi: number }[];
  domains: DomainROIData[];
  predictions: {
    breakEvenMonth: number | null;
    netROI: number | null;
    totalCost: number;
    totalBenefit: number;
    tccTotal: number;
    tccRatio: number;
    tccClassification: "Lean" | "Moderate" | "Complex";
  };
  spendBuckets: SpendBucket[];
  fteTimeline: PeoplePlanEntry[];
  replacementTimeline: ReplacementRow[];
}

export function ROIScene({ projectId }: { projectId: string }) {
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExplainers, setShowExplainers] = useState(false);
  const [targets, setTargets] = useState<TargetTargets>({
    hypothesis: "Stabilize OMS globally and retire EBS by FY28.",
    deadlineYear: new Date().getFullYear() + 3,
    budgetCeiling: 750000000,
    capexPreference: 0.65,
    headcountEnvelope: 180,
    blackoutStart: "11-01",
    blackoutEnd: "01-15",
  });
  const telemetry = useTelemetry("roi_dashboard", { projectId });
  const hasHydratedTargets = useRef(false);
  const lastFeasibilityStatus = useRef<FeasibilityResult["status"] | null>(null);
  const openExplainability = () => setShowExplainers(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/roi/forecast?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        const json = (await res.json()) as FinancialForecast;
        if (!cancelled) setForecast(json);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load ROI forecast";
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!forecast) return;
    telemetry.log("roi_forecast_viewed", {
      projectId,
      breakEvenMonth: forecast.predictions.breakEvenMonth,
      netROI: forecast.predictions.netROI,
      tccRatio: forecast.predictions.tccRatio,
    });
  }, [forecast, projectId, telemetry]);

  useEffect(() => {
    const key = `roi_targets_${projectId}`;
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (saved) {
        const parsed = JSON.parse(saved) as TargetTargets;
        setTargets((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.warn("[ROI] failed to restore targets", err);
    } finally {
      hasHydratedTargets.current = true;
    }
  }, [projectId]);

  useEffect(() => {
    if (!hasHydratedTargets.current) return;
    const key = `roi_targets_${projectId}`;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(targets));
      }
    } catch (err) {
      console.warn("[ROI] failed to persist targets", err);
    }
    telemetry.log("roi_targets_changed", {
      projectId,
      budgetCeiling: targets.budgetCeiling,
      deadlineYear: targets.deadlineYear,
      capexPreference: targets.capexPreference,
      headcountEnvelope: targets.headcountEnvelope,
    });
  }, [projectId, targets, telemetry]);

  const feasibility = useMemo(
    () =>
      forecast
        ? evaluateFeasibility(forecast, targets)
        : { status: "feasible_with_risk", breakdown: [{ label: "Forecast", detail: "Awaiting data" }] },
    [forecast, targets],
  );

  useEffect(() => {
    if (!forecast) return;
    if (lastFeasibilityStatus.current === feasibility.status) return;
    telemetry.log("roi_feasibility_evaluated", {
      projectId,
      status: feasibility.status,
      constraintCount: feasibility.breakdown.length,
    });
    lastFeasibilityStatus.current = feasibility.status;
  }, [feasibility, forecast, projectId, telemetry]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading ROI forecast…</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!forecast) {
    return <p className="text-sm text-slate-500">No forecast available.</p>;
  }

  return (
    <div className="space-y-6">
      <TargetsPanel
        targets={targets}
        onChange={setTargets}
        feasibility={feasibility}
        onInspect={() => telemetry.log("roi_targets_reviewed", { projectId, status: feasibility.status })}
        onWhy={openExplainability}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <ExecutiveSummaryCard forecast={forecast} feasibility={feasibility} onWhy={openExplainability} />
        <ConstraintSummaryCard forecast={forecast} feasibility={feasibility} targets={targets} />
      </section>

      <Card className="p-6 space-y-3">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Spend Forecast</p>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Costs vs benefits by fiscal year</h2>
            <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={openExplainability}>
              Why this?
            </button>
          </div>
          <p className="text-xs text-slate-500">Click the chart to inspect monthly detail.</p>
        </header>
        <ROIChart
          data={forecast.timeline}
          breakEvenMonth={forecast.predictions.breakEvenMonth}
          currentMonth={forecast.timeline[forecast.timeline.length - 1]?.month ?? 0}
        />
        <SpendTable buckets={forecast.spendBuckets} />
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <PeoplePlanCard timeline={forecast.fteTimeline} onWhy={openExplainability} />
        <ReplacementTimelineCard rows={forecast.replacementTimeline} onWhy={openExplainability} />
      </section>

      <ExplainabilityPanel
        open={showExplainers}
        onToggle={(nextOpen) => {
          setShowExplainers(nextOpen);
          telemetry.log(nextOpen ? "roi_explainability_opened" : "roi_explainability_closed", {
            projectId,
            status: feasibility.status,
          });
        }}
        forecast={forecast}
        targets={targets}
        feasibility={feasibility}
      />
    </div>
  );
}

type TargetTargets = {
  hypothesis: string;
  deadlineYear: number;
  budgetCeiling: number;
  capexPreference: number;
  headcountEnvelope: number;
  blackoutStart: string;
  blackoutEnd: string;
};

type FeasibilityResult = {
  status: "feasible" | "feasible_with_risk" | "infeasible";
  breakdown: { label: string; detail: string }[];
};

function evaluateFeasibility(forecast: FinancialForecast, targets: TargetTargets): FeasibilityResult {
  const breakdown: FeasibilityResult["breakdown"] = [];
  const totalCost = forecast.predictions.totalCost ?? 0;
  if (targets.budgetCeiling && totalCost > targets.budgetCeiling) {
    breakdown.push({
      label: "Budget",
      detail: `${formatCurrency(totalCost)} exceeds ceiling ${formatCurrency(targets.budgetCeiling)}`,
    });
  }

  const timelineMonths = forecast.timeline[forecast.timeline.length - 1]?.month ?? 0;
  const currentYear = new Date().getFullYear();
  const deadlineMonths = (targets.deadlineYear - currentYear) * 12;
  if (deadlineMonths > 0 && timelineMonths > deadlineMonths) {
    breakdown.push({
      label: "Timeline",
      detail: `Plan runs ${Math.max(0, timelineMonths - deadlineMonths)} months past ${targets.deadlineYear}`,
    });
  }

  const estimatedPeakFte = forecast.fteTimeline.reduce((max, item) => Math.max(max, item.fte), 0);
  if (targets.headcountEnvelope && estimatedPeakFte > targets.headcountEnvelope) {
    breakdown.push({
      label: "Headcount",
      detail: `Peak staffing ${estimatedPeakFte} FTE exceeds envelope ${targets.headcountEnvelope}`,
    });
  }

  if (!breakdown.length && totalCost > targets.budgetCeiling * 0.9) {
    breakdown.push({
      label: "Budget margin",
      detail: "Forecast is within 10% of ceiling; recommend contingency.",
    });
    return { status: "feasible_with_risk", breakdown };
  }

  return {
    status: breakdown.length ? "infeasible" : "feasible",
    breakdown,
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value ?? 0);
}

function formatPercent(value: number | null): string {
  if (value == null) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

type TargetsPanelProps = {
  targets: TargetTargets;
  feasibility: FeasibilityResult;
  onChange: (targets: TargetTargets) => void;
  onInspect: () => void;
  onWhy: () => void;
};

function TargetsPanel({ targets, feasibility, onChange, onInspect, onWhy }: TargetsPanelProps) {
  return (
    <Card className="p-6 space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Targets</p>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Set success criteria</h2>
            <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={onWhy}>
              Why this?
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-500">The forecast updates as you change these inputs.</p>
        </div>
        <BadgeForStatus status={feasibility.status} />
      </header>
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Program hypothesis</span>
        <textarea
          className="w-full rounded-2xl border border-slate-300 p-3 text-sm"
          value={targets.hypothesis}
          onChange={(event) => onChange({ ...targets, hypothesis: event.target.value })}
          rows={2}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LabeledField
          label="Deadline (FY)"
          type="number"
          value={targets.deadlineYear}
          onChange={(value) => onChange({ ...targets, deadlineYear: Number(value) })}
        />
        <LabeledField
          label="Budget ceiling"
          type="number"
          value={targets.budgetCeiling}
          onChange={(value) => onChange({ ...targets, budgetCeiling: Number(value) })}
          prefix="$"
        />
        <LabeledField
          label="Capex preference"
          type="number"
          value={Math.round(targets.capexPreference * 100)}
          onChange={(value) => onChange({ ...targets, capexPreference: Number(value) / 100 })}
          suffix="%"
        />
        <LabeledField
          label="Headcount envelope"
          type="number"
          value={targets.headcountEnvelope}
          onChange={(value) => onChange({ ...targets, headcountEnvelope: Number(value) })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Blackout {targets.blackoutStart} to {targets.blackoutEnd}</span>
        {!!feasibility.breakdown.length && (
          <button type="button" className="text-amber-600 underline" onClick={onInspect}>
            View constraints ({feasibility.breakdown.length})
          </button>
        )}
      </div>
    </Card>
  );
}

function BadgeForStatus({ status }: { status: FeasibilityResult["status"] }) {
  const config: Record<FeasibilityResult["status"], { text: string; tone: string }> = {
    feasible: { text: "Feasible", tone: "bg-emerald-100 text-emerald-800 border border-emerald-200" },
    feasible_with_risk: { text: "Feasible with risk", tone: "bg-amber-100 text-amber-800 border border-amber-200" },
    infeasible: { text: "Infeasible", tone: "bg-rose-100 text-rose-800 border border-rose-200" },
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${config[status].tone}`}>
      {config[status].text}
    </span>
  );
}

type LabeledFieldProps = {
  label: string;
  type: "text" | "number";
  value: string | number;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
};

function LabeledField({ label, type, value, onChange, prefix, suffix }: LabeledFieldProps) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center rounded-2xl border border-slate-300 px-3">
        {prefix ? <span className="text-xs text-slate-500">{prefix}</span> : null}
        <input
          className="w-full bg-transparent p-2 text-sm focus:outline-none"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <span className="text-xs text-slate-500">{suffix}</span> : null}
      </div>
    </label>
  );
}

type ExecutiveSummaryProps = {
  forecast: ROIForecast;
  feasibility: FeasibilityResult;
  onWhy: () => void;
};

function ExecutiveSummaryCard({ forecast, feasibility, onWhy }: ExecutiveSummaryProps) {
  const metrics = [
    { label: "Total Cost (3y)", value: formatCurrency(forecast.predictions.totalCost ?? 0) },
    { label: "Net ROI", value: formatPercent(forecast.predictions.netROI) },
    { label: "Break-even", value: forecast.predictions.breakEvenMonth ? `Month ${forecast.predictions.breakEvenMonth}` : "Pending" },
    { label: "TCC Ratio", value: `${(forecast.predictions.tccRatio * 100).toFixed(1)}%` },
  ];
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Executive Summary</p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{feasibility.status === "infeasible" ? "Targets blocked" : "Financial outlook"}</h3>
          <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={onWhy}>
            Why this?
          </button>
        </div>
      </div>
      <dl className="grid gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between text-sm">
            <dt className="text-slate-500">{metric.label}</dt>
            <dd className="font-semibold text-slate-900">{metric.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

type ConstraintSummaryProps = {
  forecast: ROIForecast;
  feasibility: FeasibilityResult;
  targets: TargetTargets;
};

function ConstraintSummaryCard({ forecast, feasibility, targets }: ConstraintSummaryProps) {
  const peakFte = forecast.fteTimeline.reduce((max, row) => Math.max(max, row.fte), 0);
  const totalCost = forecast.predictions.totalCost ?? 0;
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Constraint Readout</p>
        <h3 className="text-lg font-semibold text-slate-900">Targets vs plan health</h3>
      </div>
      <dl className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Budget ceiling</dt>
          <dd className="font-semibold text-slate-900">
            {formatCurrency(targets.budgetCeiling)} · {formatCurrency(totalCost)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Deadline (FY)</dt>
          <dd className="font-semibold text-slate-900">{targets.deadlineYear}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-slate-500">Peak staffing</dt>
          <dd className="font-semibold text-slate-900">{peakFte} FTE</dd>
        </div>
      </dl>
      {feasibility.breakdown.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <p className="font-semibold">Constraints at risk</p>
          <ul className="mt-2 space-y-1">
            {feasibility.breakdown.map((item) => (
              <li key={item.label}>
                <span className="font-semibold">{item.label}:</span> {item.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-emerald-700">No blocking constraints detected.</p>
      )}
    </Card>
  );
}

function SpendTable({ buckets }: { buckets: SpendBucket[] }) {
  if (!buckets.length) {
    return <p className="text-sm text-slate-500">Timeline inputs missing.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2">Year</th>
            <th className="px-3 py-2">Cost</th>
            <th className="px-3 py-2">Benefit</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket.label} className="border-t border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-900">{bucket.label}</td>
              <td className="px-3 py-2 text-slate-700">{formatCurrency(bucket.cost)}</td>
              <td className="px-3 py-2 text-emerald-700">{formatCurrency(bucket.benefit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeoplePlanCard({ timeline, onWhy }: { timeline: FteRow[]; onWhy: () => void }) {
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">People Plan</p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Peak staffing by year</h3>
          <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={onWhy}>
            Why this?
          </button>
        </div>
      </div>
      {!timeline.length ? (
        <p className="text-sm text-slate-500">Add stage headcount to unlock staffing estimates.</p>
      ) : (
        <ul className="space-y-2">
          {timeline.map((row) => (
            <li key={row.label} className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-900">{row.label}</span>
              <span className="text-slate-600">{row.fte} FTE</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ReplacementTimelineCard({ rows, onWhy }: { rows: ReplacementRow[]; onWhy: () => void }) {
  return (
    <Card className="p-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Replacement & Savings</p>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Retirements + savings start</h3>
          <button type="button" className="text-xs font-semibold text-slate-500 underline" onClick={onWhy}>
            Why this?
          </button>
        </div>
      </div>
      {!rows.length ? (
        <p className="text-sm text-slate-500">Add retirement targets to surface savings.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.name} className="rounded-2xl border border-slate-100 px-3 py-2">
              <p className="font-semibold text-slate-900">{row.name}</p>
              <p className="text-xs text-slate-500">Break-even {row.breakEven} · Savings {row.savings}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

type ExplainabilityPanelProps = {
  open: boolean;
  onToggle: (nextOpen: boolean) => void;
  forecast: FinancialForecast;
  targets: TargetTargets;
  feasibility: FeasibilityResult;
};

function ExplainabilityPanel({ open, onToggle, forecast, targets, feasibility }: ExplainabilityPanelProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-200 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Card className="mx-auto max-w-6xl rounded-b-none rounded-t-3xl border border-slate-200 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Explainability</p>
            <h3 className="text-lg font-semibold text-slate-900">Math explainers + inputs</h3>
          </div>
          <Button variant="outline" size="xs" onClick={() => onToggle(false)}>
            Close
          </Button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">TCC Formula</p>
            <p className="text-xs text-slate-500">
              total = stageCost + resources + operational + risk + governance
            </p>
            <ul className="mt-2 space-y-1">
              <li>stageCost: {formatCurrency(forecast.predictions.totalCost ?? 0)}</li>
              <li>capex preference: {(targets.capexPreference * 100).toFixed(0)}%</li>
              <li>risk posture: {feasibility.status}</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Constraint checks</p>
            {feasibility.breakdown.length ? (
              <ul className="mt-2 space-y-1">
                {feasibility.breakdown.map((item) => (
                  <li key={item.label} className="text-amber-700">
                    <span className="font-semibold">{item.label}:</span> {item.detail}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-emerald-700">No blocking constraints detected.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
