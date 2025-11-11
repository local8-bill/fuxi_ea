"use client";
import React from "react";
import { useParams } from "next/navigation";

import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";

import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { AddL1Dialog } from "@/ui/components/AddL1Dialog";
import { CapabilitySection } from "@/ui/components/CapabilitySection";
import { ScoringControlsBar } from "@/ui/components/ScoringControlsBar";
import { ScoringLabsSection } from "@/ui/components/ScoringLabsSection";
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ScoringControlsBar
        domainFilter={domainFilter}
        domains={domains}
        sortKey={sortKey}
        onDomainChange={setDomainFilter}
        onSortChange={setSortKey}
        onAddL1={() => setShowAddL1(true)}
        onOpenWeights={() => setWeightsOpen(true)}
      />

      <ScoringLabsSection
        projectId={id}
        storage={localStorageAdapter}
        existingL1={existingL1}
        onImportApplied={reload}
        onVisionAccept={(s) => {
          addL1(s.name, s.domain);
          reload();
        }}
      />

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
      ) : (
        <CapabilitySection
          sorted={sorted}
          grouped={grouped}
          domainFilter={domainFilter}
          weights={weights}
          expandedL1={expandedL1}
          onToggle={toggleExpanded}
          onOpen={setOpenId}
          compositeFor={compositeFor}
        />
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
