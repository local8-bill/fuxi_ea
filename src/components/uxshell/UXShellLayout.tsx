"use client";

import type { ReactNode } from "react";
import { UXShellTopbar } from "./UXShellTopbar";

interface UXShellLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
  sidebarHidden?: boolean;
  showShortcuts?: boolean;
  onTips?: () => void;
}

export function UXShellLayout({ sidebar, children, sidebarHidden = false, showShortcuts = true, onTips }: UXShellLayoutProps) {
  const gridClass = sidebarHidden ? "uxshell-shell-grid sidebar-hidden" : "uxshell-shell-grid";

  return (
    <div className="uxshell-layout">
      <UXShellTopbar showShortcuts={showShortcuts} onTips={onTips} />
      <div className={gridClass}>
        {!sidebarHidden ? <aside className="uxshell-sidebar">{sidebar}</aside> : null}
        <main className="uxshell-content">{children}</main>
      </div>
    </div>
  );
}

export const UX_SHELL_LOCK = true;
