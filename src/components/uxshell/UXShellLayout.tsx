"use client";

import type { ReactNode } from "react";

interface UXShellLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function UXShellLayout({ sidebar, children }: UXShellLayoutProps) {
  return (
    <div className="uxshell-layout">
      <aside className="uxshell-sidebar">{sidebar}</aside>
      <main className="uxshell-content">{children}</main>
    </div>
  );
}

export const UX_SHELL_LOCK = true;
