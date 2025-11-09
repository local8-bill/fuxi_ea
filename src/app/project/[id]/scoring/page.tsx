"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";
import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { defaultWeights } from "@/domain/services/scoring";
import { CapabilityAccordionCard } from "@/ui/components/CapabilityAccordionCard";
import { AddL1Dialog } from "@/ui/components/AddL1Dialog";

export default function ScoringPage() {
  const { id } = useParams() as { id: string };
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
  } = useScoringPage(id, localStorageAdapter);

  const [sortKey, setSortKey] = React.useState("name");
  const [domainFilter, setDomainFilter] = React.useState("All Domains");
  const [weightsOpen, setWeightsOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

  // --- Sorting & Filtering ---
  const domains = Array.from(
    new Set(items.map((x) => x.domain ?? "Unassigned"))
  ).sort();

  const filtered =
    domainFilter === "All Domains"
      ? items
      : items.filter((x) => x.domain === domainFilter);

  const sorted = [...filtered].sort((a, b) =>
    sortKey === "score"
      ? b.score - a.score
      : a.name.localeCompare(b.name)
  );

  // --- Group by Domain for All Domains view ---
  const grouped =
    domainFilter === "All Domains"
      ? Object.groupBy(sorted, (x) => x.domain ?? "Unassigned")
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* --- Controls --- */}
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
          onChange={(e) => setSortKey(e.target.value)}
        >
          <option value="name">Sort: Name</option>
          <option value="score">Sort: Score</option>
        </select>

        <button className="btn" onClick={() => setAddOpen(true)}>
          Add L1
        </button>
        <button className="btn ml-auto" onClick={() => setWeightsOpen(true)}>
          Weights
        </button>
      </div>

      {/* --- Conditional Renders --- */}
      {sorted.length === 0 ? (
        <div className="card mt-6">
          <div className="font-medium mb-2">No capabilities yet</div>
          <p className="text-sm opacity-70 mb-3">
            Start by adding an L1 capability or importing a capability map.
          </p>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            Add L1
          </button>
        </div>
      ) : domainFilter === "All Domains" && grouped ? (
        // --- Grouped by Domain ---
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
        // --- Single-domain view ---
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

      {/* --- Drawers --- */}
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
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(name, domain) => addL1(name, domain)}
        domainSuggestions={domains}
      />
    </div>
  );
}