"use client";

import { useRouter } from "next/navigation";
import { NavSection } from "./NavSection";
import { useChevronNav } from "@/hooks/useChevronNav";
import { PlusIcon, SumIcon, FlowIcon, CheckIcon, InfinityIcon } from "./NavIcons";

type Mode = "Architect" | "Analyst" | "CFO" | "FP&A" | "CIO";

interface SidebarProps {
  projectId: string;
  currentProjectId: string;
  onModeChange?: (mode: Mode) => void;
}

const projects = [
  { id: "700am", name: "700am — Core", status: "LIVE" },
  { id: "951pm", name: "951pm — Pilot", status: "DRAFT" },
  { id: "demo", name: "Demo Workspace", status: "DEMO" },
];

const viewSections = [
  {
    title: "ROI",
    icon: <SumIcon />,
    items: [
      { label: "ROI 1 (Hypothesis)", path: "/roi-dashboard" },
      { label: "ROI 2 (Actuals)", path: "/roi-dashboard?mode=actuals" },
      { label: "ROI 3 (Scenario B)", path: "/roi-dashboard?mode=scenario-b" },
      { label: "+ New ROI", path: "/roi-dashboard?new=true" },
    ],
  },
  { title: "+ Graph", icon: <PlusIcon />, items: [{ label: "Digital Enterprise", path: "/digital-enterprise" }] },
  { title: "⇄ Sequencer", icon: <FlowIcon />, items: [{ label: "Transformation", path: "/transformation-dialogue" }] },
  { title: "✓ Review", icon: <CheckIcon />, items: [{ label: "Harmonization Review", path: "/harmonization-review" }] },
  { title: "∞ Digital Enterprise", icon: <InfinityIcon />, items: [{ label: "Systems View", path: "/digital-enterprise" }] },
];

const modes: Mode[] = ["Architect", "Analyst", "CFO", "FP&A", "CIO"];

export function Sidebar({ projectId, currentProjectId, onModeChange }: SidebarProps) {
  const router = useRouter();
  const { expanded, activeItem, toggleSection, selectItem } = useChevronNav(projectId);

  const handleSelect = (section: string, path: string) => {
    selectItem(section, path);
    const href = `/project/${projectId}${path}`;
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-[12px] uppercase tracking-[0.25em] text-slate-500">Projects</p>
        <NavSection
          title="Projects"
          icon={<span />}
          items={projects.map((p) => ({
            label: p.name,
            path: `/uxshell?project=${p.id}`,
            isActive: currentProjectId === p.id,
            rightLabel: p.status,
            onClick: () => handleSelect("Projects", `/uxshell`), // project switch handled via href
          }))}
          isExpanded
          onToggle={toggleSection}
        />
        <button className="w-full text-left text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-lg px-2 py-1.5">
          + New Project
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-[12px] uppercase tracking-[0.25em] text-slate-500">Views</p>
        {viewSections.map((s) => (
          <NavSection
            key={s.title}
            title={s.title}
            icon={s.icon}
            items={s.items.map((i) => ({
              ...i,
              isActive: activeItem === i.path,
              onClick: () => handleSelect(s.title, i.path),
            }))}
            isExpanded={expanded === s.title || s.title === "ROI"}
            onToggle={toggleSection}
          />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-[12px] uppercase tracking-[0.25em] text-slate-500">Modes</p>
        <NavSection
          title="Modes"
          icon={<span />}
          items={modes.map((m) => ({
            label: m,
            path: `mode-${m}`,
            isActive: activeItem === `mode-${m}`,
            onClick: () => {
              selectItem("Modes", `mode-${m}`);
              onModeChange?.(m);
            },
          }))}
          isExpanded
          onToggle={toggleSection}
        />
      </div>
    </div>
  );
}
