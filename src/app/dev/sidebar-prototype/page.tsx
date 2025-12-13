"use client";

import { UXShellLayout } from "@/components/uxshell/UXShellLayout";

export default function SidebarPrototypePage() {
  return (
    <UXShellLayout projectId="700am" activeScene="digital" activeMode="Architect" showShortcuts={false}>
      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Sidebar Prototype</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">ShadCN Navigation Rail</h1>
        <p className="mt-3 text-sm text-slate-600">
          This route mirrors the D086C specification. Use Cmd/Ctrl + B to collapse the rail, verify local storage persistence, and ensure views/modes trigger navigation events without
          touching production scenes.
        </p>
      </div>
    </UXShellLayout>
  );
}
