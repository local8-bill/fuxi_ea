"use client";

import { useRouter } from "next/navigation";
import { NavSection, NavItem } from "./NavSection";
import { useChevronNav } from "@/hooks/useChevronNav";
import { emitTelemetry } from "./telemetry";
import { pushWithContext } from "@/lib/navigation/pushWithContext";
import { setExperienceScene, type ExperienceScene } from "@/hooks/useExperienceFlow";

export type Mode = "Architect" | "Analyst" | "CFO" | "FP&A" | "CIO";

interface SidebarProps {
  projectId: string;
  currentProjectId: string;
  currentView?: string;
  currentFocus?: string | null;
  onModeChange?: (mode: Mode) => void;
}

const projects = [
  { id: "700am", name: "700am — Core" },
  { id: "951pm", name: "951pm — Pilot" },
  { id: "demo", name: "Demo Workspace" },
];

const roiViews = [
  { key: "roi-hypothesis", label: "ROI 1 (Hypothesis)", roiId: "hypothesis" },
  { key: "roi-actuals", label: "ROI 2 (Actuals)", roiId: "actuals" },
  { key: "roi-scenario", label: "ROI 3 (Scenario B)", roiId: "scenario-b" },
  { key: "roi-new", label: "+ New ROI", roiId: "new" },
];

type ViewShortcut = { key: string; icon: string; label: string; scene: ExperienceScene };

const viewShortcuts: ViewShortcut[] = [
  { key: "view-digital", icon: "∞", label: "Digital Twin", scene: "digital" },
  { key: "view-sequencer", icon: "⇄", label: "Sequencer", scene: "sequencer" },
  { key: "view-review", icon: "✓", label: "Review", scene: "review" },
];

const intelligenceShortcuts = [
  { key: "intel-activity", label: "User Activity", icon: "◎", focus: "activity" },
  { key: "intel-engagement", label: "User Engagement", icon: "◎", focus: "engagement" },
  { key: "intel-actions", label: "User Actions", icon: "◎", focus: "actions" },
] as const;

const modes: Mode[] = ["Architect", "Analyst", "CFO", "FP&A", "CIO"];

const scrollToTop = () => {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    // ignore SSR
  }
};

function buildExperienceHref(projectId: string, scene: string) {
  return `/project/${projectId}/experience?scene=${scene}`;
}

export function Sidebar({ projectId, currentProjectId, currentView, currentFocus, onModeChange }: SidebarProps) {
  const router = useRouter();
  const targetProject = currentProjectId || projectId;
  const { expandedMain, roiExpanded, activeItem, toggleMain, toggleRoi, selectItem } = useChevronNav(projectId);

  const handleProjectSelect = (id: string) => {
    const key = `project-${id}`;
    if (activeItem === key) {
      scrollToTop();
      void emitTelemetry("uxshell_click", { projectId, section: "Projects", item: key, action: "scroll_top" });
      return;
    }
    selectItem("Projects", key);
    pushWithContext(router, buildExperienceHref(id, currentView ?? "command"), { from: currentView ?? "command" });
  };

  const handleNewProject = () => {
    selectItem("Projects", "new-project");
    pushWithContext(router, "/project/new", { from: currentView ?? "command" });
  };

  const handleViewRoute = (key: string, scene: string) => {
    if (activeItem === key) {
      scrollToTop();
      void emitTelemetry("uxshell_click", { projectId, section: "Views", item: key, action: "scroll_top" });
      return;
    }
    selectItem("Views", key);
    setExperienceScene(targetProject, scene as any);
    pushWithContext(router, buildExperienceHref(targetProject, scene), { from: currentView ?? "command", targetView: scene });
  };

  const handleModeSelect = (mode: Mode) => {
    const key = `mode-${mode}`;
    if (activeItem === key) {
      scrollToTop();
      return;
    }
    selectItem("Modes", key);
    onModeChange?.(mode);
    void emitTelemetry("uxshell_mode_changed", { projectId, mode });
  };

  const handleIntelligenceRoute = (itemKey: string, focus: string) => {
    const focusKey = `intel-${focus}`;
    if (activeItem === itemKey && currentView === "insights") {
      scrollToTop();
      return;
    }
    selectItem("Intelligence", itemKey);
    setExperienceScene(targetProject, "insights");
    const query = new URLSearchParams({ scene: "insights", focus });
    pushWithContext(router, `/project/${targetProject}/experience?${query.toString()}`, {
      from: currentView ?? "command",
      targetView: "insights",
    });
    void emitTelemetry("uxshell_click", {
      projectId,
      section: "Intelligence",
      item: focusKey,
      action: "navigate_insights",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <NavSection
        title="PROJECTS"
        isExpanded={expandedMain === "Projects"}
        onToggle={() => toggleMain("Projects")}
        items={[
          ...projects.map((p) => ({
            label: p.name,
            isActive: activeItem === `project-${p.id}` || targetProject === p.id,
            onClick: () => handleProjectSelect(p.id),
          })),
          {
            label: "+ New Project",
            isActive: activeItem === "new-project",
            onClick: handleNewProject,
          },
        ]}
      />

      <NavSection title="VIEWS" isExpanded={expandedMain === "Views"} onToggle={() => toggleMain("Views")} disableIndent>
        <button
          type="button"
          aria-label="Σ ROI"
          onClick={toggleRoi}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-[6px] text-[12px] font-semibold text-slate-800 transition hover:bg-neutral-100"
        >
          <span className="text-base text-slate-700" aria-hidden="true">
            {roiExpanded ? "▾" : "▸"}
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="text-base">Σ</span>
            <span>ROI</span>
          </span>
        </button>
        {roiExpanded &&
          roiViews.map((view) => (
            <NavItem
              key={view.key}
              label={view.label}
              icon="Σ"
              isActive={activeItem === view.key}
              inset
              testId={`view-${view.key}`}
              onClick={() => handleViewRoute(view.key, "roi")}
            />
          ))}

        {viewShortcuts.map((view) => (
          <NavItem
            key={view.key}
            label={view.label}
            icon={view.icon}
            isActive={activeItem === view.key}
            testId={`view-${view.key}`}
            onClick={() => handleViewRoute(view.key, view.scene)}
          />
        ))}
      </NavSection>

      <NavSection
        title="MODES"
        isExpanded={expandedMain === "Modes"}
        onToggle={() => toggleMain("Modes")}
        items={modes.map((m) => ({
          label: m,
          isActive: activeItem === `mode-${m}`,
          onClick: () => handleModeSelect(m),
        }))}
      />

      <NavSection
        title="INTELLIGENCE"
        isExpanded={expandedMain === "Intelligence"}
        onToggle={() => toggleMain("Intelligence")}
        items={intelligenceShortcuts.map((item) => ({
          label: item.label,
          icon: item.icon,
          isActive:
            (activeItem === item.key && currentView === "insights") || currentFocus === item.focus,
          onClick: () => handleIntelligenceRoute(item.key, item.focus),
          testId: item.key,
        }))}
      />
    </div>
  );
}
