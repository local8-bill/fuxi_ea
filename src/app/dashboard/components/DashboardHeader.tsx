"use client";

import React from "react";

type DashboardHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
};

export function DashboardHeader({ title, subtitle, badge }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Fuxi EA</p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
      {badge && (
        <span className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </header>
  );
}
