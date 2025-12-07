"use client";

import { useRouter } from "next/navigation";
import { NavSection, NavItem } from "./NavSection";
import { useChevronNav } from "@/hooks/useChevronNav";
import { emitTelemetry } from "./telemetry";
import { pushWithContext } from "@/lib/navigation/pushWithContext";

export type Mode = "Architect" | "Analyst" | "CFO" | "FP&A" | "CIO";

interface SidebarProps {
  projectId: string;
  currentProjectId: string;
  currentView?: string;
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

const viewShortcuts = [
  { key: "view-graph", icon: "➕", label: "Graph", path: "/digital-enterprise", targetView: "graph" },
  { key: "view-sequencer", icon: "⇄", label: "Sequencer", path: "/sequencer", targetView: "sequencer" },
  { key: "view-review", icon: "✓", label: "Review", path: "/review", targetView: "review" },
  { key: "view-digital", icon: "∞", label: "Digital Enterprise", path: "/digital-enterprise?view=systems", targetView: "graph" },
];

const modes: Mode[] = ["Architect", "Analyst", "CFO", "FP&A", "CIO"];

const scrollToTop = () => {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    // ignore SSR
  }
};

function buildHref(projectId: string, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/project/${projectId}${normalized}`;
}

export function Sidebar({ projectId, currentProjectId, currentView, onModeChange }: SidebarProps) {
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
    pushWithContext(router, buildHref(id, "/dashboard"), { from: currentView ?? "graph" });
  };

  const handleNewProject = () => {
    selectItem("Projects", "new-project");
    pushWithContext(router, "/project/new", { from: currentView ?? "graph" });
  };

  const handleViewRoute = (key: string, path: string, options?: { ensureRoi?: boolean; targetView?: string }) => {
    if (activeItem === key) {
      scrollToTop();
      void emitTelemetry("uxshell_click", { projectId, section: "Views", item: key, action: "scroll_top" });
      return;
    }
    selectItem("Views", key, { ensureRoi: options?.ensureRoi });
    pushWithContext(router, buildHref(targetProject, path), {
      from: currentView ?? "graph",
      targetView: options?.targetView,
    });
  };

  const handleModeSelect = (mode: Mode) => {
    const key = `mode-${mode}`;
    if (activeItem === key) {
      scrollToTop();
      return;
    }
    selectItem("Modes", key);
    onModeChange?.(mode);
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

      <NavSection title="VIEWS" isExpanded={expandedMain === "Views"} onToggle={() => toggleMain("Views")}>
        <div className="space-y-1 pl-2">
          <button
            type="button"
            onClick={toggleRoi}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-[6px] text-[12px] font-semibold text-slate-800 transition hover:bg-neutral-100"
          >
            <span className="text-base text-slate-700" aria-hidden>
              {roiExpanded ? "▾" : "▸"}
            </span>
            <span className="text-[11px]" aria-hidden>
              ∑
            </span>
            <span>ROI</span>
          </button>
          {roiExpanded &&
            roiViews.map((view) => (
              <NavItem
                key={view.key}
                label={view.label}
                icon="∑"
                isActive={activeItem === view.key}
                onClick={() => handleViewRoute(view.key, `/roi/${view.roiId}`, { ensureRoi: true, targetView: "roi" })}
              />
            ))}

          {viewShortcuts.map((view) => (
            <NavItem
              key={view.key}
              label={view.label}
              icon={view.icon}
              isActive={activeItem === view.key}
              onClick={() => handleViewRoute(view.key, view.path, { targetView: view.targetView })}
            />
          ))}
        </div>
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
    </div>
  );
}
