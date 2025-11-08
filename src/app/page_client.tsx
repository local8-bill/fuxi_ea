// src/app/page_client.tsx
"use client";

import React, { useState } from "react";
import { TopBar } from "@/components/header/TopBar";            // ← your current TopBar path
import { GridView } from "@/components/views/GridView";          // ← no props
import { HeatmapView } from "@/components/views/HeatmapView";    // ← no props
import { ScoringSheet } from "@/components/scoring/ScoringSheet"; // ← context-based drawer

export default function PageClient() {
  const [view, setView] = useState<"grid" | "heat">("grid");

  return (
    <div className="min-h-screen bg-white">
      <TopBar view={view} setView={setView} />
      <main className="mx-auto max-w-[1100px] p-4">
        {view === "grid" ? <GridView /> : <HeatmapView />}
      </main>
      {/* Mount once so clicks open it */}
      <ScoringSheet />
    </div>
  );
}