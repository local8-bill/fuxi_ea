"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";
import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { defaultWeights } from "@/domain/services/scoring";
import { CapabilityAccordionCard } from "@/ui/components/CapabilityAccordionCard";

export default function ScoringPage() {
  const { id } = useParams() as { id: string };
  const {
    items, weights, setWeights,
    openId, setOpenId, selected, updateScores,
    expandedL1, toggleExpanded,
    compositeFor,
  } = useScoringPage(id, localStorageAdapter);

  const [sortKey, setSortKey] = React.useState("name");
  const [domainFilter, setDomainFilter] = React.useState("All Domains");
  const [weightsOpen, setWeightsOpen] = React.useState(false);

  const domains = Array.from(new Set(items.map(x => x.domain ?? "Unassigned"))).sort();
  const filtered = items.filter(x => domainFilter === "All Domains" || x.domain === domainFilter);
  const sorted = [...filtered].sort((a, b) => sortKey === "score" ? b.score - a.score : a.name.localeCompare(b.name));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <select className="select" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option>All Domains</option>
          {domains.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value="name">Sort: Name</option>
          <option value="score">Sort: Score</option>
        </select>
        <button className="btn ml-auto" onClick={() => setWeightsOpen(true)}>Weights</button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(x => (
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
    </div>
  );
}