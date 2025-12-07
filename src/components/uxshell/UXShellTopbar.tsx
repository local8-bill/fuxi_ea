"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bars3Icon,
  GlobeAltIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useAgentMemory } from "@/hooks/useAgentMemory";
import { pushWithContext } from "@/lib/navigation/pushWithContext";
import { emitTelemetry } from "./telemetry";

type NavIconConfig = {
  key: string;
  label: string;
  targetView?: "graph" | "roi" | "sequencer" | "review";
  buildHref: (projectId: string) => string;
  Icon: typeof GlobeAltIcon;
};

const navIcons: NavIconConfig[] = [
  {
    key: "graph",
    label: "Digital Enterprise",
    Icon: GlobeAltIcon,
    targetView: "graph",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=digital`,
  },
  {
    key: "roi",
    label: "ROI Dashboard",
    Icon: RectangleGroupIcon,
    targetView: "roi",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=roi`,
  },
  {
    key: "sequencer",
    label: "Sequencer",
    Icon: Squares2X2Icon,
    targetView: "sequencer",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=sequencer`,
  },
  {
    key: "review",
    label: "Review",
    Icon: RectangleStackIcon,
    targetView: "review",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=review`,
  },
  {
    key: "search",
    label: "Insights",
    Icon: MagnifyingGlassIcon,
    buildHref: (projectId) => `/project/${projectId}/insights`,
  },
  {
    key: "home",
    label: "Home",
    Icon: HomeIcon,
    buildHref: (projectId) => `/project/${projectId}/experience?scene=command`,
  },
];

export function UXShellTopbar() {
  const router = useRouter();
  const { topbarCue, projectId, state } = useAgentMemory(true);
  const activeView = state?.lastView;

  const resolvedProjectId = useMemo(() => projectId || "700am", [projectId]);

  const handleNavigate = (config: NavIconConfig) => {
    const href = config.buildHref(resolvedProjectId);
    pushWithContext(router, href, {
      from: activeView ?? undefined,
      targetView: config.targetView,
      intent: "topbar_nav",
    });
    void emitTelemetry("uxshell_topbar_nav", {
      projectId: resolvedProjectId,
      icon: config.key,
      targetView: config.targetView,
      href,
    });
  };

  return (
    <header className="uxshell-topbar">
      <div className="flex w-full max-w-7xl items-center justify-between px-4 text-white">
        <div className="flex items-center gap-3">
          <Bars3Icon className="h-5 w-5" aria-hidden />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Fuxi · Enterprise Engine</p>
            <p className="text-sm font-semibold">Unified Experience Shell</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-200">
          {navIcons.map((config) => {
            const { key, Icon } = config;
            const isActive = topbarCue === key || (config.targetView && activeView === config.targetView);
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleNavigate(config)}
                className={`rounded-xl px-3 py-1 text-xs font-semibold tracking-wide transition ${
                  isActive ? "bg-white/15 text-emerald-200" : "hover:bg-white/10"
                } ${topbarCue === key ? "animate-pulse" : ""}`}
                aria-label={`${config.label} shortcut`}
                title={config.label}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
