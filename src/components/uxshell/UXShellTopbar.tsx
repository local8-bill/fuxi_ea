"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { IconType } from "@/components/ui/icons";
import { Icons } from "@/components/ui/icons";
import { useAgentMemory } from "@/hooks/useAgentMemory";
import { pushWithContext } from "@/lib/navigation/pushWithContext";
import { emitTelemetry } from "./telemetry";

type NavIconConfig = {
  key: string;
  label: string;
  targetView?: "graph" | "roi" | "sequencer" | "review";
  buildHref: (projectId: string) => string;
  Icon: IconType;
};

const navIcons: NavIconConfig[] = [
  {
    key: "graph",
    label: "Digital Enterprise",
    Icon: Icons.graph,
    targetView: "graph",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=digital`,
  },
  {
    key: "roi",
    label: "ROI Dashboard",
    Icon: Icons.roi,
    targetView: "roi",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=roi`,
  },
  {
    key: "sequencer",
    label: "Sequencer",
    Icon: Icons.sequencer,
    targetView: "sequencer",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=sequencer`,
  },
  {
    key: "review",
    label: "Review",
    Icon: Icons.intelligence,
    targetView: "review",
    buildHref: (projectId) => `/project/${projectId}/experience?scene=review`,
  },
  {
    key: "search",
    label: "Insights",
    Icon: Icons.search,
    buildHref: (projectId) => `/project/${projectId}/insights`,
  },
  {
    key: "home",
    label: "Home",
    Icon: Icons.home,
    buildHref: (projectId) => `/project/${projectId}/experience?scene=command`,
  },
];

export function UXShellTopbar({ showShortcuts = true, onTips }: { showShortcuts?: boolean; onTips?: () => void }) {
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
      <div className="uxshell-topbar-inner text-white">
        <div className="flex items-center gap-3">
          <Icons.menu className="h-5 w-5" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Fuxi · Enterprise Engine</p>
            <p className="text-sm font-semibold">Unified Experience Shell</p>
          </div>
        </div>
        {showShortcuts ? (
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
                  <Icon size={16} strokeWidth={1.5} aria-hidden />
                </button>
              );
            })}
            {onTips ? (
              <button
                type="button"
                onClick={() => onTips()}
                className="flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold tracking-wide text-slate-100 transition hover:bg-white/10"
                aria-label="Tips overlay"
                title="Tips overlay"
              >
                <Icons.insights size={16} strokeWidth={1.5} aria-hidden />
                Tips
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
