"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { Icons } from "@/components/ui/icons";

type RailSide = "left" | "right";

interface RailProps {
  side: RailSide;
  collapsed: boolean;
  onToggle: () => void;
  children?: ReactNode;
  title?: string;
}

export function Rail({ side, collapsed, onToggle, children, title }: RailProps) {
  const widthClass = collapsed ? "w-6" : "w-[240px]";
  const Chevron = collapsed ? (side === "left" ? Icons.chevronRight : Icons.chevronLeft) : side === "left" ? Icons.chevronLeft : Icons.chevronRight;
  const buttonPosition = side === "left" ? "-right-3" : "-left-3";

  return (
    <aside className={clsx("relative flex-shrink-0 transition-all duration-150 ease-out", widthClass)}>
      {!collapsed ? (
        <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#232336] px-4 py-5 text-sm text-white shadow-none">
          {title ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">{title}</p> : null}
          <div className="flex-1 space-y-4 overflow-y-auto">{children}</div>
        </div>
      ) : null}
      <button
        type="button"
        aria-label={collapsed ? `Expand ${side} rail` : `Collapse ${side} rail`}
        onClick={onToggle}
        className={clsx(
          "absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#1a1a27] text-xs font-semibold text-white transition hover:bg-[#2a2a3a]",
          buttonPosition,
        )}
      >
        <Chevron size={14} strokeWidth={1.5} aria-hidden />
      </button>
    </aside>
  );
}
