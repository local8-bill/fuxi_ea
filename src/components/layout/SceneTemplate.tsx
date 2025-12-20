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

const RAIL_WIDTH_CLASS = "w-[clamp(240px,18vw,320px)]";

export function SceneTemplate({ leftRail, rightRail, children }: SceneTemplateProps) {
  const { leftCollapsed, rightCollapsed, toggleLeft, toggleRight } = useRailState();
  const showLeft = Boolean(leftRail);
  const showRight = Boolean(rightRail);

  return (
    <section className="scene-template relative z-20 flex min-h-[640px] w-full bg-white text-slate-900">
      {showLeft ? (
        <div
          className={clsx(
            "relative flex flex-col overflow-visible transition-[width] duration-200 ease-out",
            leftCollapsed ? "w-0 border-transparent bg-transparent" : clsx(RAIL_WIDTH_CLASS, "border-r border-slate-200 bg-slate-50"),
          )}
        >
          <div className={clsx("flex-1 overflow-y-auto p-5", leftCollapsed && "pointer-events-none opacity-0")}>{leftRail}</div>
          <RailToggle side="left" collapsed={leftCollapsed} onToggle={toggleLeft} />
        </div>
      ) : null}

      <div className="flex h-full flex-1 flex-col overflow-hidden px-4 py-6 min-h-0 sm:px-5 lg:px-6" style={{ minHeight: "calc(100vh - 144px)" }}>
        {children}
      </div>

      {showRight ? (
        <div
          className={clsx(
            "relative flex flex-col overflow-visible transition-[width] duration-200 ease-out",
            rightCollapsed ? "w-0 border-transparent bg-transparent" : clsx(RAIL_WIDTH_CLASS, "border-l border-slate-200 bg-slate-50"),
          )}
        >
          <RailToggle side="right" collapsed={rightCollapsed} onToggle={toggleRight} />
          <div className={clsx("flex-1 overflow-y-auto p-5", rightCollapsed && "pointer-events-none opacity-0")}>{rightRail}</div>
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
        "absolute top-16 z-[500] flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:top-20 transform",
        side === "left"
          ? "right-0 translate-x-1/2"
          : collapsed
            ? "left-0 -translate-x-1/2"
            : "-left-4",
      )}
    >
      <Icon size={16} strokeWidth={1.6} />
    </button>
  );
}
