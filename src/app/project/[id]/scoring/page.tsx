"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CapabilityProvider, useCapabilities } from "@/features/capabilities/CapabilityProvider";
import { TopBar } from "@/components/header/TopBar";
import { GridView } from "@/components/views/GridView";
import { HeatmapView } from "@/components/views/HeatmapView";
import { ScoringPanel } from "@/components/scoring/ScoringPanel";

function Body() {
  const { view, setView, query, setQuery, domain, setDomain, domains, weights, setWeights, openId } = useCapabilities();
  const [panelOpen, setPanelOpen] = useState(false);
  useEffect(()=> setPanelOpen(!!openId), [openId]);

  return (
    <div className="space-y-3">
      <TopBar
        view={view} setView={setView}
        query={query} setQuery={setQuery}
        domain={domain} setDomain={setDomain}
        domains={domains}
        weights={weights} setWeights={setWeights}
      />
      {view === "grid" ? <GridView /> : <HeatmapView />}
      {panelOpen && <ScoringPanel onClose={()=>setPanelOpen(false)} />}
    </div>
  );
}

export default function ProjectScoringPage() {
  const { id } = useParams() as { id: string };
  return (
    <CapabilityProvider projectId={id}>
      <Body />
    </CapabilityProvider>
  );
}
