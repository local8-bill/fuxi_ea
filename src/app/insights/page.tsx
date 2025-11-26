"use client";

import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { getMockInsights, listPrimitives, listIndustryCases } from "@/controllers/insightController";
import type { Opportunity } from "@/domain/knowledge";

const COLORS = ["#2563eb", "#9333ea", "#0ea5e9", "#1e293b", "#334155", "#64748b"];

export default function InsightsPage() {
  const opportunities = React.useMemo(() => getMockInsights(), []);
  const primitives = listPrimitives();
  const cases = listIndustryCases();

  const scatterData = opportunities.map((opp) => ({
    x: opp.impactEffort.effort,
    y: opp.impactEffort.impact,
    z: opp.aiOpportunityIndex,
    name: opp.title,
    quadrant: opp.impactEffort.quadrant,
  }));

  const indexByQuadrant = ["quick_win", "strategic_investment", "self_service", "deprioritize"].map(
    (q) => ({
      quadrant: q,
      count: opportunities.filter((o) => o.impactEffort.quadrant === q).length,
    }),
  );

  const frictionCounts = opportunities.reduce<Record<string, number>>((acc, opp) => {
    opp.frictionZones.forEach((fz) => {
      acc[fz] = (acc[fz] ?? 0) + 1;
    });
    return acc;
  }, {});

  const frictionData = Object.entries(frictionCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Fuxi EA</p>
          <h1 className="text-3xl font-semibold text-slate-900">Insight & AI Opportunity Engine</h1>
          <p className="text-sm text-slate-600">
            Explore AI opportunities, impact/effort, and friction zones derived from normalized data.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Impact vs Effort</p>
              <p className="text-sm text-slate-600">
                Bubble size reflects AI Opportunity Index (higher is better).
              </p>
            </div>
          </div>
          <div className="w-full" style={{ minHeight: 320 }}>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Effort"
                  stroke="#94a3b8"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Impact"
                  stroke="#94a3b8"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.04)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  formatter={(value: any, name: any, props: any) => {
                    if (name === "z") return [`${value}`, "AI Opportunity Index"];
                    return [value, name];
                  }}
                />
                <Legend />
                <Scatter
                  name="Opportunities"
                  data={scatterData}
                  fill="#2563eb"
                  shape="circle"
                  line
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
              Opportunities by Quadrant
            </p>
            <div className="w-full" style={{ minHeight: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={indexByQuadrant}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="quadrant" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.04)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
              Friction Zone Distribution
            </p>
            <div className="w-full" style={{ minHeight: 240 }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={frictionData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={3}
                  >
                    {frictionData.map((entry, idx) => (
                      <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.04)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Opportunities</p>
              <p className="text-sm text-slate-600">
                Sorted by AI Opportunity Index; mock data for now.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Friction</th>
                  <th className="px-3 py-2 text-left">Primitives</th>
                  <th className="px-3 py-2 text-left">Impact</th>
                  <th className="px-3 py-2 text-left">Effort</th>
                  <th className="px-3 py-2 text-left">Readiness</th>
                  <th className="px-3 py-2 text-left">AI Index</th>
                  <th className="px-3 py-2 text-left">Quadrant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opportunities
                  .slice()
                  .sort((a, b) => b.aiOpportunityIndex - a.aiOpportunityIndex)
                  .map((opp) => (
                    <tr key={opp.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-slate-900">{opp.title}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {opp.frictionZones.join(", ")}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {opp.primitives
                          .map((p) => primitives.find((x) => x.id === p)?.name ?? p)
                          .join(", ")}
                      </td>
                      <td className="px-3 py-2">{opp.impactEffort.impact}</td>
                      <td className="px-3 py-2">{opp.impactEffort.effort}</td>
                      <td className="px-3 py-2">{opp.impactEffort.readiness ?? 0}</td>
                      <td className="px-3 py-2 font-semibold text-slate-900">
                        {opp.aiOpportunityIndex}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{opp.impactEffort.quadrant}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">
            Industry Cases (Reference)
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {cases.map((c, idx) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{c.challenge}</p>
                  <span className="text-[11px] text-slate-500">{c.industry}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{c.notes}</p>
                <div className="mt-2 text-xs text-slate-500">
                  Primitives: {c.primitives.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
