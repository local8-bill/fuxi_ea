"use client";

import { Card } from "@/components/ui/Card";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { Stage } from "@/components/layout/Stage";

const transitionPairs = [
  { id: "baseline", label: "2024 Baseline → 2026 Target", currentId: "graph_current_24", futureId: "graph_future_26", status: "Verifying" },
  { id: "long", label: "2025 Snapshot → 2028 Target", currentId: "graph_current_25", futureId: "graph_future_28", status: "Ready" },
];

const diffStats = {
  addedNodes: 14,
  removedNodes: 3,
  changedNodes: 9,
  addedEdges: 22,
  removedEdges: 6,
  changedEdges: 11,
};

const changeSets = {
  added: ["OMS (Global)", "DataHub", "Supplier Portal", "Analytics Mesh"],
  removed: ["DOMS", "Legacy Supplier Portal"],
  changed: ["Commerce Integration Layer", "Finance Gateway", "Logistics Bus"],
};

const verificationChecklist = [
  { id: "naming", label: "System naming aligned with harmonized map", status: "complete" },
  { id: "ownership", label: "Ownership & domain tags confirmed", status: "in-progress" },
  { id: "signals", label: "ALE transition payload emitted", status: "pending" },
];

const aleSignals = [
  { id: "confidence", label: "Confidence", value: "0.74" },
  { id: "change-frequency", label: "Change frequency", value: "High" },
  { id: "risk", label: "Integration risk", value: "Medium" },
];

export function TransitionScene({ projectId }: { projectId: string }) {
  return (
    <SceneTemplate leftRail={<TransitionLeftRail />} rightRail={<TransitionRightRail />}>
      <Stage>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-2">
          <header>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Transition Plane</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Compare current vs. future architecture</h1>
            <p className="text-sm text-slate-600">
              Validate modernization diffs before they feed the Sequencer. Project · {projectId}
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard label="Added systems" value={diffStats.addedNodes} hint="+2 awaiting approval" />
            <SummaryCard label="Removed systems" value={diffStats.removedNodes} hint="Retirements staged" />
            <SummaryCard label="Changed integrations" value={diffStats.changedEdges} hint="Needs verification" />
          </div>

          <Card className="space-y-4 border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Diff summary</p>
                <p className="text-xs text-slate-500">Transition payload drafts the signals sent to ALE.</p>
              </div>
              <button type="button" className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-700">
                Emit transition payload
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <DiffStat label="Added nodes" value={diffStats.addedNodes} tone="positive" />
              <DiffStat label="Removed nodes" value={diffStats.removedNodes} tone="neutral" />
              <DiffStat label="Changed nodes" value={diffStats.changedNodes} tone="warn" />
              <DiffStat label="Added edges" value={diffStats.addedEdges} tone="positive" />
              <DiffStat label="Removed edges" value={diffStats.removedEdges} tone="neutral" />
              <DiffStat label="Changed edges" value={diffStats.changedEdges} tone="warn" />
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-200 p-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <ColumnList title="Current Estate" subtitle="graph_current_24" items={["DOMS", "Legacy Supplier Portal", "Finance Gateway", "Planning Hub"]} />
              <ColumnList title="Future Estate" subtitle="graph_future_26" items={["OMS (Global)", "Supplier Portal", "Finance Gateway", "DataHub"]} />
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Change legend</p>
              <p className="mt-2 text-xs text-slate-500">🟢 Added · 🔴 Removed · 🟡 Changed</p>
            </div>
          </Card>

          <Card className="space-y-4 border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">Change sets</p>
            <div className="grid gap-4 md:grid-cols-3">
              <ChangeList title="Added" items={changeSets.added} accent="emerald" />
              <ChangeList title="Removed" items={changeSets.removed} accent="rose" />
              <ChangeList title="Changed" items={changeSets.changed} accent="amber" />
            </div>
          </Card>
        </div>
      </Stage>
    </SceneTemplate>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card className="space-y-1 rounded-2xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">{hint}</p> : null}
    </Card>
  );
}

function DiffStat({ label, value, tone }: { label: string; value: number; tone: "positive" | "neutral" | "warn" }) {
  const toneClass =
    tone === "positive" ? "text-emerald-600 bg-emerald-50" : tone === "warn" ? "text-amber-600 bg-amber-50" : "text-slate-600 bg-slate-50";
  return (
    <div className={`rounded-2xl border border-slate-100 p-3 text-sm font-semibold ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl">{value}</p>
    </div>
  );
}

function ColumnList({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <ul className="mt-3 space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangeList({ title, items, accent }: { title: string; items: string[]; accent: "emerald" | "rose" | "amber" }) {
  const accentClass =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : accent === "rose"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  return (
    <div className={`rounded-2xl border p-4 text-sm ${accentClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em]">{title}</p>
      <ul className="mt-2 space-y-1 text-slate-900">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TransitionLeftRail() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Comparisons</p>
        <div className="mt-3 space-y-2">
          {transitionPairs.map((pair) => (
            <div key={pair.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{pair.label}</p>
              <p className="text-xs text-slate-500">
                {pair.currentId} → {pair.futureId}
              </p>
              <span className="mt-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em]">
                {pair.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <p className="text-sm font-semibold text-slate-900">Diff stats</p>
        <ul className="mt-2 space-y-1">
          <li>Added nodes: {diffStats.addedNodes}</li>
          <li>Removed nodes: {diffStats.removedNodes}</li>
          <li>Changed nodes: {diffStats.changedNodes}</li>
          <li>Added edges: {diffStats.addedEdges}</li>
        </ul>
      </div>
      <button type="button" className="w-full rounded-2xl border border-slate-900 px-3 py-2 text-sm font-semibold text-slate-900">
        Open in Graph view
      </button>
    </div>
  );
}

function TransitionRightRail() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Verification</p>
        <div className="mt-3 space-y-2">
          {verificationChecklist.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" checked={item.status === "complete"} readOnly className="accent-emerald-600" />
              {item.label}
              {item.status !== "complete" ? <span className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-400">({item.status})</span> : null}
            </label>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">ALE Signals</p>
        <div className="mt-3 space-y-2">
          {aleSignals.map((signal) => (
            <div key={signal.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{signal.label}</span>
              <span className="text-sm font-semibold text-slate-900">{signal.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
