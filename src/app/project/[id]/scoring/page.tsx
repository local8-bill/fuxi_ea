"use client";
import React from "react";
import { VisionPanel } from "@/ui/components/VisionPanel";
import { useParams } from "next/navigation";
import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";
import { CapabilityAccordionCard } from "@/ui/components/CapabilityAccordionCard";
import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { AddL1Dialog } from "@/ui/components/AddL1Dialog";
import { ImportPanel } from "@/ui/components/ImportPanel";
import { defaultWeights } from "@/domain/services/scoring";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    items,
    weights,
    setWeights,
    openId,
    setOpenId,
    selected,
    updateScores,
    expandedL1,
    toggleExpanded,
    compositeFor,
    addL1,
    reload,
  } = useScoringPage(id, localStorageAdapter);

  // Feature flags (flip to false for prod if you want)
  const LABS_IMPORT = true; // or: process.env.NODE_ENV !== "production"
  const LABS_VISION = true; // or: process.env.NODE_ENV !== "production"

  const [sortKey, setSortKey] = React.useState<"name" | "score">("name");
  const [domainFilter, setDomainFilter] = React.useState("All Domains");
  const [weightsOpen, setWeightsOpen] = React.useState(false);
  const [showAddL1, setShowAddL1] = React.useState(false);
  const [showVision, setShowVision] = React.useState(false);

  const domains = React.useMemo(
    () => Array.from(new Set(items.map((x) => x.domain ?? "Unassigned"))).sort(),
    [items],
  );

  const filtered = React.useMemo(
    () =>
      items.filter(
        (x) => domainFilter === "All Domains" || x.domain === domainFilter,
      ),
    [items, domainFilter],
  );

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sortKey === "score") {
          const d = b.score - a.score;
          return d !== 0 ? d : a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      }),
    [filtered, sortKey],
  );

  // Group when All Domains selected; force "Unassigned" last
  const grouped = React.useMemo(() => {
    if (domainFilter !== "All Domains") return null;
    const b: Record<string, typeof items> = {};
    for (const it of sorted) (b[it.domain ?? "Unassigned"] ??= []).push(it);
    const keys = Object.keys(b).sort((x, y) =>
      x === "Unassigned" ? 1 : y === "Unassigned" ? -1 : x.localeCompare(y),
    );
    return keys.map((k) => [k, b[k]] as const); // ordered entries
  }, [sorted, domainFilter, items]);

  const existingL1 = React.useMemo(() => items.map((i) => i.name), [items]);

  const importRef = React.useRef<HTMLDivElement | null>(null);
  const scoreRef = React.useRef<HTMLDivElement | null>(null);
  const vizRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Show a super-light loading placeholder (avoids flicker)
  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="card">Loading project…</div>
      </main>
    );
  }

  const step = sorted.length === 0 ? "Import" : showVision ? "Visualize" : "Score";
  const scoreData = sorted.slice(0, 12).map((s) => ({ name: s.name, score: Number(s.score ?? 0) }));
  const domainStats = grouped?.map(([domain, caps]) => {
    const avg = caps.reduce((sum, c) => sum + c.score, 0) / Math.max(1, caps.length);
    return { domain, avg: Number(avg.toFixed(1)), count: caps.length };
  });
  const totalCaps = items.length;
  const totalDomains = domains.length;
  const avgScore =
    totalCaps === 0 ? 0 : Number((items.reduce((sum, c) => sum + c.score, 0) / totalCaps).toFixed(1));
  const emptyState = sorted.length === 0;
  const emptyTitle = "No capabilities yet";
  const emptyBody = "Import a capability map or add an L1 to begin scoring.";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          Project: {id}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Capability Workspace</h1>
            <p className="text-sm text-slate-500">
              Import capability maps, score them, and visualize readiness per domain.
            </p>
          </div>
          <div className="flex gap-2">
            {(["Import", "Score", "Visualize"] as const).map((label) => {
              const target = label === "Import" ? importRef : label === "Score" ? scoreRef : vizRef;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => scrollToRef(target)}
                  className={`fx-pill ${step === label ? "active" : ""}`}
                  aria-label={`Jump to ${label}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section className="card border border-slate-200 p-4 rounded-2xl">
        <div className="grid gap-2 sm:grid-cols-3 text-sm text-slate-700">
          <span className="fx-pill justify-between w-full" aria-label="Total capabilities">
            <span>Capabilities</span>
            <strong>{totalCaps}</strong>
          </span>
          <span className="fx-pill justify-between w-full" aria-label="Total domains">
            <span>Domains</span>
            <strong>{totalDomains}</strong>
          </span>
          <span className="fx-pill justify-between w-full" aria-label="Average score">
            <span>Avg Score</span>
            <strong>{avgScore}</strong>
          </span>
        </div>
      </section>

      {/* Scope / filters */}
      <section className="card border border-slate-200 p-4 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
          >
            <option>All Domains</option>
            {domains.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select
            className="select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as "name" | "score")}
          >
            <option value="name">Sort: Name</option>
            <option value="score">Sort: Score</option>
          </select>

          <button className="btn" onClick={() => setShowAddL1(true)} aria-label="Add new L1 capability">
            Add Capability (L1)
          </button>

          {LABS_VISION && (
            <button className="btn" onClick={() => setShowVision((v) => !v)} aria-label="Toggle visualize view">
              {showVision ? "Hide Visualize" : "Visualize"}
            </button>
          )}

          <button className="btn ml-auto" onClick={() => setWeightsOpen(true)} aria-label="Adjust scoring weights">
            Weights
          </button>
        </div>
      </section>

      {/* Import */}
      <section ref={importRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Import</div>
            <div className="text-xs text-slate-500">
              Upload capability CSV/JSON; preview and validate before scoring.
            </div>
          </div>
          <span className="fx-pill">Supported: CSV, JSON</span>
        </div>
        {LABS_IMPORT && (
          <div className="mt-3">
            <ImportPanel
              projectId={id}
              storage={localStorageAdapter}
              existingL1={existingL1}
              defaultOpen={false}
              onApplied={() => reload()}
            />
          </div>
        )}
      </section>

      {/* Scoring */}
      <section ref={scoreRef} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Score</div>
            <div className="text-xs text-slate-500">
              Inline scoring for each capability; adjust weights and filters as you go.
            </div>
          </div>
          <div className="flex gap-2 text-xs text-slate-600">
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#ef4444" }} /> Gap</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#eab308" }} /> Neutral</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#22c55e" }} /> Strong</span>
          </div>
        </div>

        {emptyState ? (
          <div className="card rounded-xl border border-slate-200 p-6 flex flex-col items-start gap-3 bg-slate-50">
            <div className="text-sm font-semibold">{emptyTitle}</div>
            <p className="text-sm text-slate-600">{emptyBody}</p>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => setShowAddL1(true)}>
                Add L1 Capability
              </button>
              <button
                className="btn"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
                  input?.click();
                }}
              >
                Import CSV/JSON
              </button>
            </div>
          </div>
        ) : domainFilter === "All Domains" && grouped ? (
          <>
            {grouped.map(([domain, caps]) => (
              <section key={domain} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{domain}</h2>
                  {domainStats && (
                    <span className="fx-pill text-xs">
                      Avg: {domainStats.find((d) => d.domain === domain)?.avg ?? 0} ·{" "}
                      {domainStats.find((d) => d.domain === domain)?.count ?? 0} caps
                    </span>
                  )}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caps.map((x) => (
                    <CapabilityAccordionCard
                      key={x.id}
                      cap={x.raw}
                      l1Score={x.score}
                      weights={weights}
                      expanded={!!expandedL1[x.id]}
                      onToggle={() => toggleExpanded(x.id)}
                      onOpen={(cid) => setOpenId(cid)}
                      compositeFor={compositeFor}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((x) => (
              <CapabilityAccordionCard
                key={x.id}
                cap={x.raw}
                l1Score={x.score}
                weights={weights}
                expanded={!!expandedL1[x.id]}
                onToggle={() => toggleExpanded(x.id)}
                onOpen={(cid) => setOpenId(cid)}
                compositeFor={compositeFor}
              />
            ))}
          </section>
        )}
      </section>

      {/* Visualization */}
      <section ref={vizRef} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Visualize</div>
            <div className="text-xs text-slate-500">Domain averages and top capability scores.</div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="text-xs font-semibold text-slate-700 mb-2">Top Capabilities</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="text-xs font-semibold text-slate-700 mb-2">Domain Summary</div>
            <div className="space-y-2 text-sm text-slate-800">
              {(domainStats ?? []).map((d) => (
                <div key={d.domain} className="flex items-center justify-between rounded-md bg-white px-3 py-2 border border-slate-100">
                  <span className="font-semibold">{d.domain}</span>
                  <span className="text-xs text-slate-600">Avg {d.avg} · {d.count} caps</span>
                </div>
              ))}
              {!domainStats?.length && <div className="text-xs text-slate-500">No domain data yet.</div>}
            </div>
          </div>
        </div>
      </section>

      {/* Drawers & Dialogs */}
      <ScoringDrawer
        open={!!selected}
        onClose={() => setOpenId(null)}
        cap={selected}
        weights={weights}
        onPatch={(patch) => selected && updateScores(selected.id, patch)}
      />

      <WeightsDrawer
        open={weightsOpen}
        onClose={() => setWeightsOpen(false)}
        weights={weights}
        setWeights={setWeights}
        defaults={defaultWeights}
      />

      <AddL1Dialog
        open={showAddL1}
        onClose={() => setShowAddL1(false)}
        onCreate={(name, domain) => addL1(name, domain)}
        domainSuggestions={domains}
      />
    </main>
  );
}
