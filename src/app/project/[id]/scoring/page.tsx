"use client";
import React from "react";
import { VisionPanel } from "@/ui/components/VisionPanel";
import { useParams, useRouter } from "next/navigation";
import { useScoringPage } from "@/controllers/useScoringPage";
import { localStorageAdapter } from "@/adapters/storage/local";
import { CapabilityAccordionCard } from "@/ui/components/CapabilityAccordionCard";
import { ScoringDrawer } from "@/ui/components/ScoringDrawer";
import { WeightsDrawer } from "@/ui/components/WeightsDrawer";
import { AddL1Dialog } from "@/ui/components/AddL1Dialog";
import { ImportPanel } from "@/ui/components/ImportPanel";
import { defaultWeights } from "@/domain/services/scoring";
import { useModernizationSummary } from "@/features/modernization/useModernizationSummary";
import { ProjectNav } from "@/features/common/ProjectNav";

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    items, weights, setWeights,
    openId, setOpenId, selected, updateScores,
    expandedL1, toggleExpanded,
    compositeFor,
    addL1, reload,
  } = useScoringPage(id, localStorageAdapter);

  // Feature flags (flip to false for prod if you want)
  const LABS_IMPORT = true; // or: process.env.NODE_ENV !== "production"
  const LABS_VISION = true; // or: process.env.NODE_ENV !== "production"

  const [sortKey, setSortKey] = React.useState<"name" | "score">("name");
  const [domainFilter, setDomainFilter] = React.useState("All Domains");
  const [weightsOpen, setWeightsOpen] = React.useState(false);
  const [showAddL1, setShowAddL1] = React.useState(false);
  const [showVision, setShowVision] = React.useState(false);
  const router = useRouter();
  const summary = useModernizationSummary();

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
      [...filtered].sort((a, b) => {
        if (sortKey === "score") {
          const d = b.score - a.score;
          return d !== 0 ? d : a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
      }),
    [filtered, sortKey]
  );

  // Group when All Domains selected; force "Unassigned" last
  const grouped = React.useMemo(() => {
    if (domainFilter !== "All Domains") return null;
    const b: Record<string, typeof items> = {};
    for (const it of sorted) (b[it.domain ?? "Unassigned"] ??= []).push(it);
    const keys = Object.keys(b).sort((x, y) =>
      x === "Unassigned" ? 1 : y === "Unassigned" ? -1 : x.localeCompare(y)
    );
    return keys.map((k) => [k, b[k]] as const); // ordered entries
  }, [sorted, domainFilter]);

  const existingL1 = React.useMemo(() => items.map((i) => i.name), [items]);

  // Show a super-light loading placeholder (avoids “twerkiness” flicker)
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="card">Loading project…</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <ProjectNav projectId={id} active="scoring" />

      <section className="card space-y-4 border border-gray-100">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Capability Scoring Workspace</p>
          <h1 className="text-3xl font-semibold text-slate-900 mt-1">Project {id}</h1>
          <p className="text-sm text-slate-500 mt-2">
            Score capabilities, compare domains, and explore AI-assisted insights for this project.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div
            className="rounded-2xl border border-gray-200 bg-slate-50 p-3 text-sm text-slate-600"
            onClick={() => router.push(`/project/${id}/modernization`)}
          >
            <div className="text-slate-800 font-semibold mb-1">Modernization</div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Workspace</div>
            <div className="flex flex-col gap-1">
              <span>Uploaded Artifacts: {summary.artifacts}</span>
              <span>Inventory Rows: {summary.inventoryRows}</span>
              <span>Normalized Apps: {summary.normalizedApps}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-slate-600">
            <div className="text-slate-800 font-semibold mb-1">Domain Filter</div>
            <p className="text-xs text-slate-500">Active selection: {domainFilter}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3 text-sm text-slate-600">
            <div className="text-slate-800 font-semibold mb-1">Sort</div>
            <p className="text-xs text-slate-500">Using {sortKey} order</p>
          </div>
        </div>
      </section>

      <section className="card border border-gray-100 p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <select className="select" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
            <option>All Domains</option>
            {domains.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <select className="select" value={sortKey} onChange={(e) => setSortKey(e.target.value as "name" | "score")}>
            <option value="name">Sort: Name</option>
            <option value="score">Sort: Score</option>
          </select>

          <button className="btn" onClick={() => setShowAddL1(true)}>
            Add L1
          </button>

          {LABS_VISION && (
            <button className="btn" onClick={() => setShowVision((v) => !v)}>
              {showVision ? "Hide Vision" : "Vision (Labs)"}
            </button>
          )}

          <button className="btn ml-auto" onClick={() => setWeightsOpen(true)}>
            Weights
          </button>
        </div>
      </section>

      {/* --- Labs panels (optional) --- */}
      {LABS_IMPORT && (
        <ImportPanel
          projectId={id}
          storage={localStorageAdapter}
          existingL1={existingL1}
          defaultOpen={false}
          onApplied={() => reload()}
        />
      )}

      {LABS_VISION && showVision && (
        <VisionPanel
          projectId={id}
          storage={localStorageAdapter}
          defaultOpen={true}
          onApplied={() => reload()}
        />
      )}

      {/* --- Main Content --- */}
      {sorted.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="font-medium" style={{ marginBottom: 8 }}>
            No capabilities yet
          </div>
          <p className="text-sm" style={{ opacity: 0.7, marginBottom: 12 }}>
            Start by adding an L1 capability or importing a capability map.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAddL1(true)}>
            Add L1
          </button>
        </div>
      ) : domainFilter === "All Domains" && grouped ? (
        // --- Grouped by Domain ---
        grouped.map(([domain, caps]) => (
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
        // --- Ungrouped grid ---
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

      {/* --- Drawers & Dialogs --- */}
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
