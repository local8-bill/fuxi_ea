// src/app/layout.tsx
import "@/app/globals.css";
import "@/styles/uxshell.css";
import type { ReactNode } from "react";
import { UnifiedShell } from "@/components/layout/UnifiedShell";
import { ModeBridge } from "@/components/system/ModeBridge";

export const metadata = {
  title: "Fuxi • Capability Scoring",
  description: "Project start + scoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-clean-white">
      <body className="min-h-screen bg-white text-slate-900">
        <UnifiedShell>
          <ModeBridge />
          {children}
        </UnifiedShell>
      </body>
    </html>
  );
}
