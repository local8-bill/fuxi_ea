"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface NavItemProps {
  label: string;
  path: string;
  isActive?: boolean;
  onClick?: (path: string) => void;
  rightLabel?: string;
}

interface NavSectionProps {
  title: string;
  icon: ReactNode;
  items?: NavItemProps[];
  isExpanded?: boolean;
  onToggle?: (title: string) => void;
}

export function NavSection({ title, icon, items = [], isExpanded = false, onToggle }: NavSectionProps) {
  const [hover, setHover] = useState(false);

  return (
    <div className="rounded-xl">
      <button
        onClick={() => onToggle?.(title)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`flex w-full items-center gap-2 px-1 py-1 text-[12px] font-semibold uppercase tracking-[0.25em] text-slate-600 transition duration-150 ease-in-out ${
          hover ? "bg-slate-50" : "bg-transparent"
        }`}
      >
        <span className="text-slate-700 text-base">{isExpanded ? "▾" : "▸"}</span>
        <span className="flex items-center gap-2 text-slate-800">
          {icon}
          {title}
        </span>
      </button>
      {isExpanded && (
        <div className="mt-2 space-y-1 pl-6">
          {items.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ label, path, isActive, onClick, rightLabel }: NavItemProps) {
  return (
    <button
      onClick={() => onClick?.(path)}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition duration-150 ease-in-out ${
        isActive
          ? "bg-slate-900 text-white font-semibold"
          : "text-slate-800 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      {rightLabel ? <span className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{rightLabel}</span> : null}
    </button>
  );
}
