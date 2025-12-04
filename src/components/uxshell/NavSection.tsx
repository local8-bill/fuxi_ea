"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface NavItemProps {
  label: string;
  path: string;
  isActive?: boolean;
  onClick?: (path: string) => void;
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
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          hover ? "bg-slate-50 border-l-2 border-slate-300" : "bg-white"
        }`}
      >
        <span className="text-slate-700">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
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

function NavItem({ label, path, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={() => onClick?.(path)}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-1 text-[12px] transition ${
        isActive ? "font-semibold text-slate-900 border-l-2 border-slate-500 bg-slate-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
