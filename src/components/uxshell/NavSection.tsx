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
        className={`flex w-full items-center gap-2 px-1.5 py-1 text-sm font-semibold transition duration-150 ease-in-out ${
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
        <div className="mt-1 space-y-1 pl-6">
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
      className={`flex w-full items-center justify-between px-1.5 py-[6px] text-[12px] transition duration-150 ease-in-out ${
        isActive ? "font-semibold text-slate-900 border-l-2 border-slate-500 bg-slate-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
      {rightLabel ? <span className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{rightLabel}</span> : null}
    </button>
  );
}
