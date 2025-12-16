"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
import { BarChart2, ChevronLeft, ChevronRight, Home, Layers, Menu, Workflow } from "lucide-react";

interface UnifiedShellProps {
  children: ReactNode;
}

export type NavSectionKey = "Projects" | "Modes" | "Roles" | "Intelligence";

export type UnifiedNavItem = {
  key: string;
  label: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
};

export type UnifiedNavModel = {
  project?: { id: string; subtitle?: string; description?: string };
  sections: Array<{ key: NavSectionKey; title: string; items: UnifiedNavItem[] }>;
};

type ShellContextValue = {
  setNavModel: (model: UnifiedNavModel | null) => void;
  setLeftRail: (content: ReactNode | null) => void;
  setRightRail: (content: ReactNode | null) => void;
};

const UnifiedShellContext = createContext<ShellContextValue | null>(null);

export function UnifiedShell({ children }: UnifiedShellProps) {
  const [navModel, setNavModel] = useState<UnifiedNavModel | null>(null);
  const [leftRail, setLeftRail] = useState<ReactNode | null>(null);
  const [rightRail, setRightRail] = useState<ReactNode | null>(null);
  const [leftRailOpen, setLeftRailOpen] = useState(true);
  const [rightRailOpen, setRightRailOpen] = useState(true);

  const handleSetNavModel = useCallback((model: UnifiedNavModel | null) => {
    setNavModel(model);
  }, []);

  useEffect(() => {
    if (!leftRail) {
      setLeftRailOpen(false);
    } else {
      setLeftRailOpen(true);
    }
  }, [leftRail]);

  useEffect(() => {
    if (!rightRail) {
      setRightRailOpen(false);
    } else {
      setRightRailOpen(true);
    }
  }, [rightRail]);

  const contextValue = useMemo<ShellContextValue>(
    () => ({
      setNavModel: handleSetNavModel,
      setLeftRail,
      setRightRail,
    }),
    [handleSetNavModel],
  );

  const hasLeftRail = Boolean(leftRail);
  const hasRightRail = Boolean(rightRail);

  return (
    <UnifiedShellContext.Provider value={contextValue}>
      <div className="uxshell-layout">
        <header className="uxshell-topbar">
          <div className="flex items-center gap-3">
            <button type="button" className="rounded p-1 text-slate-700 transition hover:bg-slate-100" aria-label="Toggle navigation">
              <Menu size={16} strokeWidth={1.6} />
            </button>
            <span className="text-sm font-semibold tracking-tight text-slate-800">Fuxi · Enterprise Engine</span>
          </div>
          <nav className="flex items-center gap-4 text-slate-700">
            <Home size={16} strokeWidth={1.5} aria-label="Home" />
            <Layers size={16} strokeWidth={1.5} aria-label="Layers" />
            <Workflow size={16} strokeWidth={1.5} aria-label="Sequencer" />
            <BarChart2 size={16} strokeWidth={1.5} aria-label="ROI" />
          </nav>
        </header>

        <div className="uxshell-body">
          <aside className="uxshell-nav-column">
            <NavColumn model={navModel} />
          </aside>
          <div className="uxshell-stage-wrapper">
            {hasLeftRail ? (
              <div className="uxshell-rail-stack uxshell-rail-stack--left">
                {leftRailOpen ? <aside className="uxshell-left-rail">{leftRail}</aside> : null}
                <button
                  type="button"
                  className="uxshell-rail-toggle"
                  aria-label={leftRailOpen ? "Collapse left rail" : "Expand left rail"}
                  onClick={() => setLeftRailOpen((prev) => !prev)}
                >
                  {leftRailOpen ? <ChevronLeft size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                </button>
              </div>
            ) : null}
            <main className="uxshell-stage">{children}</main>
            {hasRightRail ? (
              <div className="uxshell-rail-stack uxshell-rail-stack--right">
                <button
                  type="button"
                  className="uxshell-rail-toggle"
                  aria-label={rightRailOpen ? "Collapse right rail" : "Expand right rail"}
                  onClick={() => setRightRailOpen((prev) => !prev)}
                >
                  {rightRailOpen ? <ChevronRight size={14} strokeWidth={1.5} /> : <ChevronLeft size={14} strokeWidth={1.5} />}
                </button>
                {rightRailOpen ? <aside className="uxshell-right-rail">{rightRail}</aside> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </UnifiedShellContext.Provider>
  );
}

export function useUnifiedShellSlots() {
  const ctx = useContext(UnifiedShellContext);
  if (!ctx) {
    throw new Error("useUnifiedShellSlots must be used within UnifiedShell");
  }
  return ctx;
}

function NavColumn({ model }: { model: UnifiedNavModel | null }) {
  const [collapsed, setCollapsed] = useState<Record<NavSectionKey, boolean>>({
    Projects: false,
    Modes: false,
    Roles: false,
    Intelligence: false,
  });

  if (!model) {
    return (
      <div className="px-4 py-6 text-xs text-slate-500">
        <p className="font-semibold text-slate-700">Unified Navigation</p>
        <p className="mt-3 leading-relaxed text-slate-400">Scenes can register nav data with useUnifiedShellSlots().setNavModel.</p>
      </div>
    );
  }

  const toggle = (key: NavSectionKey) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 px-4 py-6 text-slate-800">
      {model.project ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm">
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">Project</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{model.project.id}</p>
          {model.project.description ? <p className="text-xs text-slate-500">{model.project.description}</p> : null}
          {model.project.subtitle ? <p className="text-xs text-slate-400">{model.project.subtitle}</p> : null}
        </div>
      ) : null}

      {model.sections.map((section) => (
        <NavSection key={section.key} title={section.title} collapsed={collapsed[section.key] ?? false} onToggle={() => toggle(section.key)} items={section.items} />
      ))}
    </div>
  );
}

function NavSection({
  title,
  collapsed,
  onToggle,
  items,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  items: UnifiedNavItem[];
}) {
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
      >
        {title}
        <span className="text-slate-400">{collapsed ? "▸" : "▾"}</span>
      </button>
      {collapsed ? null : (
        <div className="space-y-1 border-t border-slate-100 px-3 py-2">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                item.active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-800 hover:border-slate-900"
              }`}
            >
              <p className="font-semibold">{item.label}</p>
              {item.description ? <p className={item.active ? "text-xs text-slate-200" : "text-xs text-slate-500"}>{item.description}</p> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
