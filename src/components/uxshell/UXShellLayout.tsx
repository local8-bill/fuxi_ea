"use client";

import type { ReactNode } from "react";
import { UXShellTopbar } from "./UXShellTopbar";
import { SidebarNav, type SidebarMode } from "@/components/ui/sidebar";
import type { ExperienceScene } from "@/hooks/useExperienceFlow";

interface UXShellLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
  sidebarHidden?: boolean;
  showShortcuts?: boolean;
  onTips?: () => void;
  projectId?: string;
  activeScene?: ExperienceScene | "review";
  activeMode?: SidebarMode;
  onModeChange?: (mode: SidebarMode) => void;
}

export function UXShellLayout({
  sidebar,
  children,
  sidebarHidden = false,
  showShortcuts = true,
  onTips,
  projectId = "700am",
  activeScene = "digital",
  activeMode = "Architect",
  onModeChange,
}: UXShellLayoutProps) {
  const gridClass = sidebarHidden ? "uxshell-shell-grid sidebar-hidden" : "uxshell-shell-grid";
  const defaultSidebar = <SidebarNav projectId={projectId} activeScene={activeScene} activeMode={activeMode} onModeChange={onModeChange} />;

  return (
    <div className="uxshell-layout">
      <UXShellTopbar showShortcuts={showShortcuts} onTips={onTips} />
      <div className={gridClass}>
        {!sidebarHidden ? <aside className={sidebar ? "uxshell-sidebar" : "uxshell-sidebar p-0"}>{sidebar ?? defaultSidebar}</aside> : null}
        <main className="uxshell-content">{children}</main>
      </div>
    </div>
  );
}

export const UX_SHELL_LOCK = true;
