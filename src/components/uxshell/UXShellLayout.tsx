"use client";

import type { ReactNode } from "react";
import { UXShellTopbar } from "./UXShellTopbar";

interface UXShellLayoutProps {
  sidebar?: ReactNode;
  children: ReactNode;
  sidebarHidden?: boolean;
}

export function UXShellLayout({ sidebar, children, sidebarHidden = false }: UXShellLayoutProps) {
  const gridClass = sidebarHidden ? "uxshell-shell-grid sidebar-hidden" : "uxshell-shell-grid";

  return (
    <div className="uxshell-layout">
      <UXShellTopbar />
      <div className={gridClass}>
        {!sidebarHidden ? <aside className="uxshell-sidebar">{sidebar}</aside> : null}
        <main className="uxshell-content">{children}</main>
      </div>
    </div>
  );
}

export const UX_SHELL_LOCK = true;
