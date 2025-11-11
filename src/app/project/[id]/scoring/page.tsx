"use client";
import React from "react";
import { useParams } from "next/navigation";

import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";

import { CapabilityAccordionCard } from "@/ui/components/CapabilityAccordionCard";
import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { AddL1Dialog } from "@/ui/components/AddL1Dialog";
import { ImportPanel } from "@/ui/components/ImportPanel";
import { VisionPanel } from "@/ui/components/VisionPanel";
import { defaultWeights } from "@/domain/services/scoring";

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();

  const {
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

  // ── Controls
  const [sortKey, setSortKey] = React.useState<"name" | "score">("name");
  const [domainFilter, setDomainFilter] = React.useState("All Domains");
  const [weightsOpen, setWeightsOpen] = React.useState(false);
  const [showAddL1, setShowAddL1] = React.useState(false);

  // ── Domains / Sorting
  const domains = React.useMemo(
    () => Array.from(new Set(items.map((x) => x.domain ?? "Unassigned"))).sort(),
    [items]
  );

  const filtered = React.useMemo(
    () =>
      items.filter(
        (x) => domainFilter === "All Domains" || x.domain === domainFilter
      ),
    [items, domainFilter]
  );

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) =>
        sortKey === "score" ? b.score - a.score : a.name.localeCompare(b.name)
      ),
    [filtered, sortKey]
  );

  // ── Grouped view (All Domains)
  const grouped = React.useMemo<Record<string, typeof items> | null>(() => {
    if (domainFilter !== "All Domains") return null;
    const buckets: Record<string, typeof items> = {};
    for (const it of sorted) {
      const d = it.domain ?? "Unassigned";
      (buckets[d] ??= []).push(it);
    }
    return buckets;
  }, [sorted, domainFilter]);

  const existingL1 = React.useMemo(() => items.map((i) => i.name), [items]);

  // Always-on Labs (so Vercel/prod shows the row)
  const LABS = true;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* ── Controls bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
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

        <button className="btn" onClick={() => setShowAddL1(true)}>
          Add L1
        </button>

        <button className="btn ml-auto" onClick={() => setWeightsOpen(true)}>
          Weights
        </button>
      </div>

      {/* LABS: Import + Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-start">
        {/* Import */}
        <section className="card h-full min-h-[300px] flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Import (CSV / JSON) — Labs</h2>
            <span className="text-xs opacity-60">Tools</span>
          </div>
          <div className="flex-1">
            <ImportPanel
              bare
              projectId={id}
              storage={localStorageAdapter}
              existingL1={existingL1}
              onApplied={reload}
            />
          </div>
        </section>
        {/* Vision */}
        <section className="card h-full flex flex-col">
          <header className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Vision (Labs)</h2>
            <span className="text-xs opacity-60">Tools</span>
          </header>
          <div className="flex-1">
            <VisionPanel
              onAccept={(s) => {
                addL1(s.name, s.domain);
                reload();
              }}
            />
          </div>
        </section>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="font-medium mb-2">No capabilities yet</div>
          <p className="text-sm opacity-70 mb-3">
            Start by adding an L1 capability or importing a capability map.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddL1(true)}>
            Add L1
          </button>
        </div>
      ) : domainFilter === "All Domains" && grouped ? (
        // Grouped by domain
        Object.entries(grouped).map(([domain, caps]) => (
          <section key={domain} className="mb-6">
            <h2 className="text-base font-semibold mb-3">{domain}</h2>
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
        ))
      ) : (
        // Ungrouped grid
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      )}

      {/* ── Drawers & dialogs ───────────────────────────────────────── */}
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
    </div>
  );
}