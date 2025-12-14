// src/app/layout.tsx
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { GlobalNav } from "@/features/common/GlobalNav";
import { ModeBridge } from "@/components/system/ModeBridge";

export const metadata = {
  title: "Fuxi • Capability Scoring",
  description: "Project start + scoring",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Suspense fallback={null}>
          <GlobalNav />
        </Suspense>
        <ModeBridge />
        <div className="pt-6">{children}</div>
      </body>
    </html>
  );
}
