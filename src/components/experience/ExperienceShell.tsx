"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UXShellLayout } from "../uxshell/UXShellLayout";
import { Sidebar, type Mode } from "../uxshell/Sidebar";
import { useExperienceFlow, setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";
import { AgentMemoryProvider } from "@/hooks/useAgentMemory";
import { SearchModal, type SearchItem } from "../uxshell/SearchModal";
import { DigitalEnterpriseClient } from "@/app/project/[id]/digital-enterprise/DigitalEnterpriseClient";
import { ROIScene } from "@/components/experience/scenes/ROIScene";
import { InsightsScene } from "@/components/experience/scenes/InsightsScene";

const sceneMeta: Record<ExperienceScene, { title: string; summary: string }> = {
  command: { title: "Command Deck", summary: "Resume where you left off or ask the agent what's next." },
  onboarding: { title: "Guided Onboarding", summary: "Capture context and files." },
  digital: { title: "Digital Twin", summary: "Explore the harmonized map." },
  roi: { title: "ROI Dashboard", summary: "Forecast ROI/TCC impact." },
  sequencer: { title: "Sequencer", summary: "Stage modernization waves." },
  review: { title: "Review", summary: "Validate harmonization deltas." },
  insights: { title: "Insights", summary: "Surface signals and patterns." },
};

export function ExperienceShell({ projectId }: { projectId: string }) {
  return (
    <AgentMemoryProvider projectId={projectId}>
      <ExperienceShellBody projectId={projectId} />
    </AgentMemoryProvider>
  );
}

function ExperienceShellBody({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scene, setScene } = useExperienceFlow(projectId);
  const [mode, setMode] = useState<Mode>("Architect");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const queryScene = searchParams?.get("scene") as ExperienceScene | null;
    if (queryScene && queryScene !== scene) {
      setScene(queryScene);
      setExperienceScene(projectId, queryScene);
    }
  }, [projectId, scene, searchParams, setScene]);

  const handleSceneChange = useCallback(
    (next: ExperienceScene) => {
      if (next === scene) return;
      setScene(next);
      setExperienceScene(projectId, next);
      router.replace(`/project/${projectId}/experience?scene=${next}`, { scroll: false });
    },
    [projectId, router, scene, setScene],
  );

  const searchItems = useMemo<SearchItem[]>(
    () =>
      (Object.keys(sceneMeta) as ExperienceScene[]).map((id) => ({
        id,
        title: sceneMeta[id].title,
        description: sceneMeta[id].summary,
        keywords: [id],
        action: () => handleSceneChange(id),
      })),
    [handleSceneChange],
  );

  const sceneContent = useMemo(() => {
    if (scene === "digital") {
      return <DigitalEnterpriseClient projectId={projectId} />;
    }
    if (scene === "sequencer") {
      return <SequencerPlaceholder />;
    }
    if (scene === "roi") {
      return <ROIScene projectId={projectId} />;
    }
    if (scene === "insights") {
      return <InsightsScene projectId={projectId} />;
    }
    const meta = sceneMeta[scene] ?? sceneMeta.digital;
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm text-slate-800">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Experience Shell Recovery</p>
        <h1 className="text-xl font-semibold text-slate-900">{meta.title}</h1>
        <p className="text-sm text-slate-600">{meta.summary}</p>
        <p className="text-xs text-slate-500">
          Placeholder scene — real component not reintroduced yet. Mode: {mode}.
        </p>
      </div>
    );
  }, [mode, projectId, scene]);

  return (
    <UXShellLayout
      sidebar={<Sidebar projectId={projectId} currentProjectId={projectId} currentView={scene} currentFocus={null} onModeChange={setMode} />}
      showShortcuts={false}
      onTips={() => setSearchOpen(true)}
    >
      {sceneContent}
      <SearchModal open={searchOpen} initialQuery="" items={searchItems} onClose={() => setSearchOpen(false)} />
    </UXShellLayout>
  );
}

function SequencerPlaceholder() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm text-slate-800">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Sequencer</p>
        <h1 className="text-xl font-semibold text-slate-900">Sequencer temporarily offline</h1>
        <p className="text-sm text-slate-600">
          The live sequencing canvas is disabled while we isolate the Turbopack hang. You can still explore the Digital Twin
          scene, ROI dashboards, and Insights while we bring this view back online.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Sequencer data pipelines and ALE context remain intact — the UI will return once the shell stabilizes. Thanks for
        keeping the scene toggles exercised.
      </div>
    </div>
  );
}
