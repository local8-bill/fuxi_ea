// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import { GlobalNav } from "@/features/common/GlobalNav";

export const metadata = {
  title: "Fuxi • Capability Scoring",
  description: "Project start + scoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <GlobalNav />
        <div className="pt-6">{children}</div>
      </body>
    </html>
  );
}
