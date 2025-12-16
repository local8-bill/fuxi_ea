"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExperienceFlow, setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";
import { AgentMemoryProvider } from "@/hooks/useAgentMemory";
import { SearchModal, type SearchItem } from "../uxshell/SearchModal";
import { DigitalEnterpriseClient } from "@/app/project/[id]/digital-enterprise/DigitalEnterpriseClient";
import { ROIScene } from "@/components/experience/scenes/ROIScene";
import { InsightsScene } from "@/components/experience/scenes/InsightsScene";
import { SequencerScene } from "@/components/experience/scenes/SequencerScene";
import { useUnifiedShellSlots, type UnifiedNavModel } from "@/components/layout/UnifiedShell";
import { SceneTemplate } from "@/components/layout/SceneTemplate";

const sceneMeta: Record<ExperienceScene, { title: string; summary: string }> = {
  command: { title: "Command Deck", summary: "Resume where you left off or ask the agent what's next." },
  onboarding: { title: "Guided Onboarding", summary: "Capture context and files." },
  digital: { title: "Digital Twin", summary: "Explore the harmonized map." },
  roi: { title: "ROI Dashboard", summary: "Forecast ROI/TCC impact." },
  sequencer: { title: "Sequencer", summary: "Stage modernization waves." },
  review: { title: "Review", summary: "Validate harmonization deltas." },
  insights: { title: "Insights", summary: "Surface signals and patterns." },
};

const modes: Array<{ id: ExperienceScene; label: string; description: string }> = [
  { id: "digital", label: "Digital Twin", description: "Explore harmonized map" },
  { id: "sequencer", label: "Sequencer", description: "Stage modernization waves" },
  { id: "roi", label: "ROI / TCC", description: "Forecast ROI/TCC impact" },
  { id: "insights", label: "Insights", description: "Signals + telemetry" },
  { id: "review", label: "Review", description: "Validate harmonization deltas" },
];

const intelligenceLinks = [
  { key: "signals", label: "Signals", description: "Real-time change events" },
  { key: "telemetry", label: "Telemetry", description: "Experience metrics" },
  { key: "ale", label: "ALE Context", description: "Learning engine status" },
];

const roles = [
  { key: "architect", label: "Architect" },
  { key: "analyst", label: "Analyst" },
  { key: "cio", label: "CIO" },
  { key: "cfo", label: "CFO" },
  { key: "transformation", label: "Transformation Lead" },
];

export function ExperienceClient({ projectId }: { projectId: string }) {
  return (
    <AgentMemoryProvider projectId={projectId}>
      <ExperienceClientBody projectId={projectId} />
    </AgentMemoryProvider>
  );
}

function ExperienceClientBody({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scene, setScene } = useExperienceFlow(projectId);
  const [searchOpen, setSearchOpen] = useState(false);
  const { setNavModel } = useUnifiedShellSlots();

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

  const wrapWithTemplate = useCallback(
    (content: ReactNode) => (
      <SceneTemplate leftRail={<ExperienceLeftRail />} rightRail={<SceneContextRail scene={scene} />}>
        {content}
      </SceneTemplate>
    ),
    [scene],
  );

  const sceneContent = useMemo(() => {
    if (scene === "digital") return <DigitalEnterpriseClient projectId={projectId} />;
    if (scene === "sequencer") return <SequencerScene projectId={projectId} />;
    if (scene === "roi") return wrapWithTemplate(<ROIScene projectId={projectId} />);
    if (scene === "insights") return wrapWithTemplate(<InsightsScene projectId={projectId} />);
    const meta = sceneMeta[scene] ?? sceneMeta.digital;
    return wrapWithTemplate(
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm text-slate-800">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-400">Experience Shell Recovery</p>
        <h1 className="text-xl font-semibold text-slate-900">{meta.title}</h1>
        <p className="text-sm text-slate-600">{meta.summary}</p>
        <p className="text-xs text-slate-500">Placeholder scene — real component not reintroduced yet.</p>
      </div>,
    );
  }, [projectId, scene, wrapWithTemplate]);

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

  const navModel = useMemo<UnifiedNavModel>(
    () => ({
      project: { id: projectId, description: "Unified Experience Shell" },
      sections: [
        {
          key: "Projects",
          title: "Projects",
          items: [
            {
              key: projectId,
              label: `Workspace ${projectId}`,
              description: "Active project",
              active: scene === "command",
              onClick: () => handleSceneChange("command"),
            },
          ],
        },
        {
          key: "Modes",
          title: "Modes",
          items: modes.map((mode) => ({
            key: mode.id,
            label: mode.label,
            description: mode.description,
            active: scene === mode.id,
            onClick: () => handleSceneChange(mode.id as ExperienceScene),
          })),
        },
        {
          key: "Roles",
          title: "Roles",
          items: roles.map((roleItem) => ({
            key: roleItem.key,
            label: roleItem.label,
            description: "Perspective presets",
            active: false,
            onClick: () => null,
          })),
        },
        {
          key: "Intelligence",
          title: "Intelligence",
          items: intelligenceLinks.map((item) => ({
            key: item.key,
            label: item.label,
            description: item.description,
            active: false,
            onClick: () => null,
          })),
        },
      ],
    }),
    [handleSceneChange, projectId, scene],
  );

  useEffect(() => {
    setNavModel(navModel);
    return () => {
      setNavModel(null);
    };
  }, [navModel, setNavModel]);

  return (
    <div className="w-full space-y-4">
      {sceneContent}
      <SearchModal open={searchOpen} initialQuery="" items={searchItems} onClose={() => setSearchOpen(false)} />
    </div>
  );
}


function SceneContextRail({ scene }: { scene: ExperienceScene }) {
  const meta = sceneMeta[scene] ?? sceneMeta.digital;
  return (
    <div className="space-y-2 text-sm text-slate-600">
      <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Scene Context</p>
      <h3 className="text-base font-semibold text-slate-900">{meta.title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{meta.summary}</p>
    </div>
  );
}

function ExperienceLeftRail() {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Data</p>
        <div className="mt-3 space-y-2">
          <button type="button" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900">
            Load Live Data
          </button>
          <button type="button" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900">
            Load Snapshot (.json)
          </button>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">Current Source</p>
        <p>Live (API)</p>
        <p className="mt-2 font-semibold text-slate-900">ALE Context</p>
        <p>Connected</p>
      </div>
    </div>
  );
}
