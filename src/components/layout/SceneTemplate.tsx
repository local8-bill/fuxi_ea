"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRailState } from "@/hooks/useRailState";

interface SceneTemplateProps {
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  children: ReactNode;
  gap?: number;
}

export function SceneTemplate({ leftRail, rightRail, children }: SceneTemplateProps) {
  const { leftCollapsed, rightCollapsed, toggleLeft, toggleRight } = useRailState();
  const showLeft = Boolean(leftRail);
  const showRight = Boolean(rightRail);

  return (
    <section className="scene-template flex min-h-[640px] w-full bg-white text-slate-900">
      {showLeft ? (
        <div className={clsx("relative flex flex-col border-r border-slate-200 bg-slate-50 transition-all duration-200", leftCollapsed ? "w-9" : "w-[280px]")}>
          {!leftCollapsed ? <div className="flex-1 overflow-y-auto p-5">{leftRail}</div> : null}
          <RailToggle side="left" collapsed={leftCollapsed} onToggle={toggleLeft} />
        </div>
      ) : null}

      <div className="flex h-full flex-1 flex-col overflow-hidden px-6 py-6 min-h-0" style={{ minHeight: "calc(100vh - 144px)", height: "calc(100vh - 144px)" }}>
        {children}
      </div>

      {showRight ? (
        <div className={clsx("relative flex flex-col border-l border-slate-200 bg-slate-50 transition-all duration-200", rightCollapsed ? "w-9" : "w-[280px]")}>
          <RailToggle side="right" collapsed={rightCollapsed} onToggle={toggleRight} />
          {!rightCollapsed ? <div className="flex-1 overflow-y-auto p-5">{rightRail}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

function RailToggle({ side, collapsed, onToggle }: { side: "left" | "right"; collapsed: boolean; onToggle: () => void }) {
  const Icon = side === "left" ? (collapsed ? ChevronRight : ChevronLeft) : collapsed ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? `Expand ${side} rail` : `Collapse ${side} rail`}
      className={clsx(
        "absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100",
        side === "left" ? "-right-4" : "-left-4",
      )}
    >
      <Icon size={16} strokeWidth={1.6} />
    </button>
  );
}
