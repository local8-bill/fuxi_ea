"use client";

import { ThemeSwitcher } from "@/components/dev/ThemeSwitcher";

export default function ThemeSwitcherPage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a] px-6 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dev • Visual QA</p>
          <h1 className="text-2xl font-semibold">ShadCN Theme Harness</h1>
          <p className="text-sm text-slate-300">Switch base palettes to verify graphite + UXShell compatibility. Restart dev server after applying.</p>
        </div>
        <ThemeSwitcher />
      </div>
    </div>
  );
}
