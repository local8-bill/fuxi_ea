"use client";

import { Card } from "@/components/ui/Card";
import { SceneTemplate } from "@/components/layout/SceneTemplate";
import { Stage } from "@/components/layout/Stage";

const sources = [
  { id: "inventory", label: "Inventory CSV", type: "File", status: "Ready", artifacts: 2, updated: "2m ago" },
  { id: "architecture", label: "Architecture Diagram", type: "Lucid", status: "Queued", artifacts: 1, updated: "5m ago" },
  { id: "snapshot", label: "Digital Twin Snapshot", type: "JSON", status: "Merged", artifacts: 4, updated: "Just now" },
];

const domainOverview = [
  { name: "Commerce", systems: 18, readiness: 0.78 },
  { name: "Finance", systems: 22, readiness: 0.65 },
  { name: "Fulfillment", systems: 15, readiness: 0.72 },
  { name: "Data", systems: 11, readiness: 0.81 },
];

const dedupeStats = {
  duplicatesResolved: 42,
  conflicts: 3,
  coverage: 0.86,
};

const activityLog = [
  { id: "merge", label: "Merged OMS + DOMS into OMS", time: "12:04", tone: "success" },
  { id: "dedupe", label: "Resolved duplicate Planning nodes", time: "11:58", tone: "neutral" },
  { id: "inspection", label: "ALE flagged risky integrations", time: "11:52", tone: "neutral" },
];

const aleSignals = [
  { id: "stability", label: "Stability", value: "0.78" },
  { id: "readiness", label: "Readiness", value: "0.81" },
  { id: "coverage", label: "Coverage", value: "86%" },
];

export function HarmonizeScene({ projectId }: { projectId: string }) {
  return (
    <SceneTemplate leftRail={<HarmonizeLeftRail />} rightRail={<HarmonizeRightRail />}>
      <Stage>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-2">
          <header>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-400">Harmonization</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Unify artifacts into one enterprise map</h1>
            <p className="text-sm text-slate-600">Normalized graph feeds Sequencer + ROI once conflicts are cleared.</p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="space-y-1 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Systems tracked</p>
              <p className="text-2xl font-semibold text-slate-900">142</p>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">+6 pending merges</p>
            </Card>
            <Card className="space-y-1 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Integrations</p>
              <p className="text-2xl font-semibold text-slate-900">317</p>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">21 flagged for review</p>
            </Card>
            <Card className="space-y-1 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Domains</p>
              <p className="text-2xl font-semibold text-slate-900">9</p>
              <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-400">Coverage {Math.round(dedupeStats.coverage * 100)}%</p>
            </Card>
          </div>

          <Card className="space-y-4 border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Domain readiness</p>
                <p className="text-xs text-slate-500">ALE stitched readiness from inventory + snapshots.</p>
              </div>
              <span className="text-xs text-slate-500">Project · {projectId}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {domainOverview.map((domain) => (
                <div key={domain.name} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <p>{domain.name}</p>
                    <p>{domain.systems} systems</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${domain.readiness * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Readiness {(domain.readiness * 100).toFixed(0)}%</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3 border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Recent harmonization activity</p>
                <p className="text-xs text-slate-500">Dedupes and merges show up here.</p>
              </div>
              <button type="button" className="text-xs font-semibold text-emerald-600">
                View history
              </button>
            </div>
            <div className="space-y-2">
              {activityLog.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-slate-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                    <p>{entry.label}</p>
                    <p className="text-xs text-slate-400">{entry.time}</p>
                  </div>
                  <p className="text-xs text-slate-500">{entry.tone === "success" ? "Committed" : "In review"}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Stage>
    </SceneTemplate>
  );
}

function HarmonizeLeftRail() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Sources</p>
        <div className="mt-3 space-y-2">
          {sources.map((source) => (
            <div key={source.id} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                <span>{source.label}</span>
                <span className="text-xs text-slate-500">{source.type}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{source.artifacts} artifacts</span>
                <span>{source.updated}</span>
              </div>
              <span className="mt-2 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em]">
                {source.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">Deduplication</p>
        <p className="mt-1">Resolved duplicates: {dedupeStats.duplicatesResolved}</p>
        <p>Conflicts remaining: {dedupeStats.conflicts}</p>
        <p>Coverage: {(dedupeStats.coverage * 100).toFixed(0)}%</p>
      </div>
      <button type="button" className="w-full rounded-2xl border border-slate-900 px-3 py-2 text-sm font-semibold text-slate-900">
        Export harmonized graph
      </button>
    </div>
  );
}

function HarmonizeRightRail() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <p className="text-sm font-semibold text-slate-900">Next actions</p>
        <ul className="mt-3 space-y-2">
          <li>• Confirm dedupe suggestions</li>
          <li>• Tag Finance nodes with ALE readiness</li>
          <li>• Push harmonized_graph.json to Transition</li>
        </ul>
      </div>
    </div>
  );
}
