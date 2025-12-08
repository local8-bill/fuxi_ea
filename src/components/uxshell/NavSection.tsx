"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

interface NavSectionProps {
  title: string;
  isExpanded?: boolean;
  onToggle?: (title: string) => void;
  items?: NavItemProps[];
  children?: ReactNode;
  disableIndent?: boolean;
}

interface NavItemProps {
  label: string;
  icon?: string;
  rightLabel?: string;
  isActive?: boolean;
  onClick?: () => void;
  inset?: boolean;
  testId?: string;
}

export function NavSection({ title, isExpanded = false, onToggle, items, children, disableIndent = false }: NavSectionProps) {
  const chevron = useMemo(() => (isExpanded ? "▾" : "▸"), [isExpanded]);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => onToggle?.(title)}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500 transition hover:bg-neutral-100"
      >
        <span className="text-base text-slate-600" aria-hidden="true">
          {chevron}
        </span>
        <span>{title}</span>
      </button>
      {isExpanded ? (
        <div className={`space-y-1 ${disableIndent ? "" : "pl-2"}`}>
          {children
            ? children
            : items?.map((item) => <NavItem key={`${title}-${item.label}`} {...item} />)}
        </div>
      ) : null}
    </div>
  );
}

export function NavItem({ label, icon, rightLabel, isActive, onClick, inset = false, testId }: NavItemProps) {
  const baseClasses =
    "group relative flex w-full items-center justify-between rounded-lg px-3 py-[6px] text-left text-[12px] leading-[18px] transition-colors";
  const activeClasses = "bg-neutral-900 font-semibold text-white";
  const idleClasses = "text-slate-700 hover:bg-neutral-100";
  const rightClasses = isActive ? "text-white/90" : "text-slate-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${isActive ? activeClasses : idleClasses}`}
      data-testid={testId}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute left-1 top-1 bottom-1 w-[2px] rounded-full transition ${
          isActive ? "bg-white" : "bg-transparent group-hover:bg-neutral-400"
        }`}
      />
      <span className={`flex items-center gap-2 ${inset ? "pl-6" : "pl-2"}`}>
        {icon ? (
          <span className="text-[11px]" aria-hidden>
            {icon}
          </span>
        ) : null}
        <span className="truncate">{label}</span>
      </span>
      {rightLabel ? <span className={`text-[11px] uppercase tracking-[0.12em] ${rightClasses}`}>{rightLabel}</span> : null}
    </button>
  );
}
