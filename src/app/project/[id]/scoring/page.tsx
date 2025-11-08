"use client";
import React, { useState } from "react";
import { useParams } from "next/navigation";
import { CapabilityProvider, useCapabilities } from "@/features/capabilities/Provider";
import { HeaderBar } from "@/components/scoring/HeaderBar";
import { L1Grid } from "@/components/scoring/L1Grid";
import { L1Heatmap } from "@/components/scoring/L1Heatmap";
import { ScoringDrawer } from "@/components/scoring/ScoringDrawer";

function Body() {
  const { query, setQuery, domain, setDomain, domains, view, setView, weights, setWeights, openId, sortBy, setSortBy } = useCapabilities();
  const [drawerOpen, setDrawerOpen] = useState(false);
  React.useEffect(()=> setDrawerOpen(!!openId), [openId]);

  return (
    <div className="space-y-3">
      <HeaderBar
        query={query} setQuery={setQuery}
        domain={domain} setDomain={setDomain} domains={domains}
        view={view} setView={setView}
        weights={weights} setWeights={setWeights}
        sortBy={sortBy} setSortBy={setSortBy}
      />
      {view === "grid" ? <L1Grid /> : <L1Heatmap />}
      {drawerOpen && <ScoringDrawer onClose={()=>setDrawerOpen(false)} />}
    </div>
  );
}

export default function ScoringPage() {
  const { id } = useParams() as { id: string };
  return (
    <CapabilityProvider>
      <Body />
    </CapabilityProvider>
  );
}