"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Folder, LayoutDashboard, Layers, Network, Cog, ArrowLeft, ArrowRight } from "lucide-react";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import { pushWithContext } from "@/lib/navigation/pushWithContext";
import { setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";

const STORAGE_KEY = "fuxi_sidebar_collapsed_v1";
const DEFAULT_WIDTH = "240px";
const COLLAPSED_WIDTH = "72px";

type ProjectOption = { id: string; name: string; status?: string };
const FALLBACK_PROJECTS: ProjectOption[] = [
  { id: "700am", name: "700am · Core" },
  { id: "951pm", name: "951pm · Pilot" },
  { id: "demo", name: "Demo Workspace" },
];
const MAX_PROJECTS = 5;

const VIEW_LINKS: Array<{ id: ExperienceScene | "review"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "digital", label: "Digital Twin", icon: Network },
  { id: "sequencer", label: "Sequencer", icon: Layers },
  { id: "roi", label: "ROI Review", icon: LayoutDashboard },
  { id: "review", label: "Review", icon: LayoutDashboard },
];

export type SidebarMode = "Architect" | "Analyst" | "CFO" | "FP&A" | "CIO";
const MODE_OPTIONS: SidebarMode[] = ["Architect", "Analyst", "CFO", "FP&A", "CIO"];

export type SidebarNavProps = {
  projectId?: string;
  activeScene?: ExperienceScene | "review";
  activeMode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
};

export function SidebarNav({ projectId = "700am", activeScene = "digital", activeMode = "Architect", onModeChange }: SidebarNavProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectOption[]>(FALLBACK_PROJECTS);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    const root = document.documentElement;
    root.style.setProperty("--uxshell-sidebar-width", collapsed ? COLLAPSED_WIDTH : DEFAULT_WIDTH);
    return () => {
      root.style.setProperty("--uxshell-sidebar-width", DEFAULT_WIDTH);
    };
  }, [collapsed]);

  useEffect(() => {
    const handleHotkey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [toggleCollapsed]);

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects/list", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && Array.isArray(json.projects) && json.projects.length) {
          let list: ProjectOption[] = json.projects.slice(0, MAX_PROJECTS);
          if (projectId && !list.some((item) => item.id === projectId)) {
            const current = json.projects.find((item: ProjectOption) => item.id === projectId);
            if (current) list = [...list, current];
          }
          setProjects(list);
        }
      } catch {
        // ignore
      }
    };
    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleProjectSelect = useCallback(
    (id: string) => {
      if (id === projectId) {
        scrollToTop();
        return;
      }
      pushWithContext(router, `/project/${id}/experience?scene=digital`, { from: activeScene ?? "command" });
      setExperienceScene(id, "digital");
    },
    [activeScene, projectId, router],
  );

  const handleViewSelect = useCallback(
    (scene: ExperienceScene | "review") => {
      if (scene === activeScene) {
        scrollToTop();
        return;
      }
      const nextScene = scene === "review" ? "review" : scene;
      setExperienceScene(projectId, nextScene as ExperienceScene);
      pushWithContext(router, `/project/${projectId}/experience?scene=${nextScene}`, { from: activeScene ?? "command", targetView: nextScene });
      emitTelemetry("uxshell_click", { projectId, section: "views", target: nextScene });
    },
    [activeScene, projectId, router],
  );

  const handleModeSelect = useCallback(
    (mode: SidebarMode) => {
      if (mode === activeMode) {
        scrollToTop();
        return;
      }
      onModeChange?.(mode);
      emitTelemetry("uxshell_mode_changed", { projectId, mode });
    },
    [activeMode, onModeChange, projectId],
  );

  const supportsLabels = !collapsed;
  const sections = useMemo(
    () => [
      {
        id: "projects",
        label: "Projects",
        icon: Folder,
        items: projects,
      },
    ],
    [projects],
  );

  return (
    <div className={clsx("flex h-full flex-col border-r border-slate-800/40 bg-[#1E1E2E] text-slate-200 transition-[width]", collapsed ? "w-[72px]" : "w-[240px]")}>
      <header className="flex items-center justify-between px-3 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
        {supportsLabels ? <span>Fuxi</span> : <span>F</span>}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 text-slate-200 hover:border-slate-500"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto px-2 pb-4">
        {sections.map((section) => (
          <div key={section.id}>
            {supportsLabels ? (
              <p className="px-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-slate-500">{section.label}</p>
            ) : null}
            <div className="mt-2 space-y-1">
              {section.items.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800/60",
                    project.id === projectId ? "bg-slate-900 text-white" : "text-slate-200",
                    supportsLabels ? "justify-start" : "justify-center",
                  )}
                >
                  <Folder className="h-4 w-4 flex-shrink-0" aria-hidden />
                  {supportsLabels ? <span className="truncate">{project.name}</span> : null}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          {supportsLabels ? (
            <p className="px-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Views</p>
          ) : null}
          <div className="mt-2 space-y-1">
            {VIEW_LINKS.map((view) => (
              <button
                key={view.id}
                type="button"
                onClick={() => handleViewSelect(view.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800/60",
                  view.id === activeScene ? "bg-slate-900 text-white" : "text-slate-200",
                  supportsLabels ? "justify-start" : "justify-center",
                )}
              >
                <view.icon className="h-4 w-4 flex-shrink-0" aria-hidden />
                {supportsLabels ? <span>{view.label}</span> : null}
              </button>
            ))}
          </div>
        </div>

        <div>
          {supportsLabels ? (
            <p className="px-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Modes</p>
          ) : null}
          <div className="mt-2 space-y-1">
            {MODE_OPTIONS.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeSelect(mode)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-800/60",
                  mode === activeMode ? "bg-slate-900 text-white" : "text-slate-200",
                  supportsLabels ? "justify-start" : "justify-center",
                )}
              >
                <Cog className="h-4 w-4 flex-shrink-0" aria-hidden />
                {supportsLabels ? <span>{mode}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      <footer className={clsx("px-3 pb-3 text-[0.6rem] text-slate-500", supportsLabels ? "text-left" : "text-center")}>
        {supportsLabels ? "Cmd/Ctrl + B to toggle" : "⌘/Ctrl+B"}
      </footer>
    </div>
  );
}

function scrollToTop() {
  if (typeof window === "undefined") return;
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    // ignore
  }
}
