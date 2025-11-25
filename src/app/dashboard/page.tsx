"use client";

import React from "react";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardSection } from "./components/DashboardSection";
import { DigitalEnterpriseChart } from "./components/charts/DigitalEnterpriseChart";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  digitalEnterpriseMetrics,
  digitalEnterpriseSystems,
  insightFeed,
} from "@/mock/dashboardData";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <DashboardHeader
          title="Fuxi Dashboard"
          subtitle="Unified view of enterprise ecosystem, AI utilization, and insights."
          badge="v0.1"
        />

        {/* Digital Enterprise Overview */}
        <DashboardSection
          title="Digital Enterprise Overview"
          subtitle="Lucid-derived systems and integrations."
          action={
            <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400">
              Refresh
            </button>
          }
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <MetricCard
              label="SYSTEMS"
              value={digitalEnterpriseMetrics.systems.toLocaleString()}
              description="Unique labeled systems with at least one connection."
            />
            <MetricCard
              label="INTEGRATIONS"
              value={digitalEnterpriseMetrics.integrations.toLocaleString()}
              description="System-to-system connections derived from diagrams."
            />
            <MetricCard
              label="DOMAINS"
              value={digitalEnterpriseMetrics.domains.toLocaleString()}
              description="Ecosystem domains detected (placeholder)."
            />
            <div className="rounded-2xl border border-slate-200 bg-slate-900/90 text-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Top Focus</p>
              <p className="mt-2 text-lg font-semibold">Order Management</p>
              <p className="text-sm text-slate-100/90">
                Highest connectivity node; simulate upstream/downstream impact next.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                Top Systems by Integrations
              </p>
              <DigitalEnterpriseChart data={digitalEnterpriseSystems} />
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                Highest-Connectivity Systems
              </p>
              <div className="divide-y divide-slate-100">
                {digitalEnterpriseSystems.map((sys) => (
                  <div key={sys.name} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{sys.name}</p>
                      <p className="text-xs text-slate-500">
                        Criticality {(sys.criticality * 100).toFixed(0)}%
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {sys.integrations} links
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardSection>

        {/* Insight Feed */}
        <DashboardSection
          title="Insight Feed"
          subtitle="Recent notes from agents and analysis."
          action={
            <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400">
              View all
            </button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {insightFeed.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.detail}</p>
                  </div>
                  <span className="text-[11px] text-slate-500">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </main>
  );
}
