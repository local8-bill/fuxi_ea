// src/app/project/[id]/scoring/page.tsx
"use client";

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import AdhocProjectScoringProvider from "@/features/capabilities/AdhocProjectScoringProvider";

// ✅ use ONLY the project-scoped UI that reads from Adhoc provider
import { TopBar } from "@/components/project/TopBar";
import { GridView } from "@/components/project/GridView";
import { HeatmapView } from "@/components/project/HeatmapView"; // (add file below)
import { ScoringSheet } from "@/components/project/ScoringSheet";

import type { Project } from "@/types/project";

export default function ProjectScoringPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project | null>(null);
  const [view, setView] = useState<"grid" | "heat">("grid");

  useEffect(() => {
    const raw = localStorage.getItem(`fuxi:projects:${id}`);
    if (raw) {
      try { setProject(JSON.parse(raw)); } catch {}
    }
  }, [id]);

  const ready = useMemo(() => !!project, [project]);

  if (!ready) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Loading project…</p>
        <p className="mt-2 text-xs">If this persists, make sure you created the project from AI Suggest or Import.</p>
      </div>
    );
  }

  return (
    <AdhocProjectScoringProvider projectId={id} initialProject={project!}>
      <div className="min-h-screen bg-white">
        <TopBar view={view} setView={setView} />
        <main className="mx-auto max-w-[1100px] p-4">
          {view === "grid" ? <GridView /> : <HeatmapView />}
        </main>
        <ScoringSheet />
      </div>
    </AdhocProjectScoringProvider>
  );
}