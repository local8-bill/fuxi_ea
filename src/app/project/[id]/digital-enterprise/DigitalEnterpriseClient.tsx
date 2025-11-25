"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import {
  SystemImpactPanel,
  type SystemImpact,
} from "@/components/digital-enterprise/SystemImpactPanel";
import { ImpactGraph } from "@/components/ImpactGraph";
import { useImpactGraph } from "@/hooks/useImpactGraph";

interface TopSystemRaw {
  systemId?: string;
  id?: string;
  systemName?: string;
  name?: string;
  label?: string;
  integrationCount?: number;
  integrations?: number;
  degree?: number;
}

interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
  topSystems: TopSystemRaw[];
}

interface Props {
  projectId: string;
}

function resolveSystemName(s: TopSystemRaw): string {
  return (
    s.systemName ||
    s.name ||
    s.label ||
    s.id ||
    s.systemId ||
    "Unknown"
  );
}

function resolveIntegrationCount(s: TopSystemRaw): number {
  return (
    s.integrationCount ??
    s.integrations ??
    s.degree ??
    0
  );
}

function formatNumber(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

export function DigitalEnterpriseClient({ projectId }: Props) {
  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [impact, setImpact] = useState<SystemImpact | null>(null);
  const graph = useImpactGraph();
  const [layoutMode, setLayoutMode] = useState<"flow" | "dagre">("flow");
  const [colorMode, setColorMode] = useState<"domain" | "impact">("domain");
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [weightEdges, setWeightEdges] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      if (!projectId) {
        setError("Missing project ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/digital-enterprise/stats?project=${encodeURIComponent(
            projectId
          )}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("[DE-PAGE] Failed to load stats", res.status, text);
          if (!cancelled) {
            setError("Failed to load digital enterprise metrics.");
            setStats(null);
          }
          return;
        }

        const json = (await res.json()) as DigitalEnterpriseStats;
        if (!cancelled) {
          setStats(json);
          setError(null);
        }
      } catch (err: any) {
        console.error("[DE-PAGE] Error loading stats", err);
        if (!cancelled) {
          setError("Failed to load digital enterprise metrics.");
          setStats(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const hasData =
    !!stats &&
    ((stats.systemsFuture ?? 0) > 0 ||
      (stats.integrationsFuture ?? 0) > 0);

  function handleSelectSystem(name: string, degree: number) {
    // For now, we mock upstream/downstream split.
    // Backend traversal will replace this logic later.
    const upstreamCount = Math.max(0, Math.floor(degree / 2));
    const downstreamCount = Math.max(0, degree - upstreamCount);

    setImpact({
      systemName: name,
      totalDegree: degree,
      upstreamCount,
      downstreamCount,
      upstream: [],
      downstream: [],
    });
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="DIGITAL ENTERPRISE"
        title={`Ecosystem View for Project: ${projectId || "(unknown)"}`}
        description="These metrics are derived directly from your Lucid architecture diagram. We count unique systems that participate in at least one connection and their integrations."
      />

      {loading && (
        <div className="mt-10 text-sm text-gray-500">
          Loading digital enterprise metrics…
        </div>
      )}

      {!loading && error && (
        <div className="mt-10 text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="mt-10 text-sm text-gray-500">
          No digital enterprise metrics are available yet for this project.
          Upload a Lucid CSV on the Tech Stack page to populate this view.
        </div>
      )}

      {!loading && !error && hasData && stats && (
        <>
          {/* Metric cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
            <MetricCard
              label="SYSTEMS"
              value={formatNumber(stats.systemsFuture)}
              description="Unique labeled systems that participate in at least one connection in this architecture view."
            />
            <MetricCard
              label="INTEGRATIONS"
              value={formatNumber(stats.integrationsFuture)}
              description="Unique system-to-system connections derived from connector lines."
            />
            <MetricCard
              label="DOMAINS DETECTED"
              value={formatNumber(stats.domainsDetected ?? 0)}
              description="Domain / ecosystem clustering will evolve in a later pass."
            />
          </section>

          {/* Top systems table */}
          <section className="mt-12">
            <h2 className="text-sm font-semibold mb-1">IMPACT GRAPH (BETA)</h2>
            <p className="text-xs text-gray-500 mb-4">
              Interactive upstream/downstream view (mock data until graph ingestion is wired).
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setLayoutMode("flow")}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    layoutMode === "flow"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Free
                </button>
                <button
                  onClick={() => setLayoutMode("dagre")}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    layoutMode === "dagre"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Dagre
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setColorMode("domain")}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    colorMode === "domain"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Domain
                </button>
                <button
                  onClick={() => setColorMode("impact")}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    colorMode === "impact"
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Impact
                </button>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showEdgeLabels}
                    onChange={(e) => setShowEdgeLabels(e.target.checked)}
                  />
                  Labels
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weightEdges}
                    onChange={(e) => setWeightEdges(e.target.checked)}
                  />
                  Weight
                </label>
              </div>
            </div>
            <ImpactGraph
              graph={graph}
              height={520}
              layout={layoutMode}
              colorMode={colorMode}
              showEdgeLabels={showEdgeLabels}
              weightEdges={weightEdges}
            />
          </section>

          {/* Top systems table */}
          <section className="mt-12">
            <h2 className="text-sm font-semibold mb-1">
              HIGHEST-CONNECTIVITY SYSTEMS
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Top 10 systems by number of integrations in this ecosystem view.
            </p>

            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      #
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      SYSTEM
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                      INTEGRATIONS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topSystems.map((s, idx) => {
                    const name = resolveSystemName(s);
                    const count = resolveIntegrationCount(s);
                    const key = s.systemId ?? s.id ?? `${name}-${idx}`;

                    return (
                      <tr
                        key={key}
                        className={
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                        }
                      >
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleSelectSystem(name, count)}
                            className="text-left w-full underline-offset-2 hover:underline"
                          >
                            {name}
                          </button>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {formatNumber(count)}
                        </td>
                      </tr>
                    );
                  })}
                  {stats.topSystems.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-4 text-xs text-gray-500"
                        colSpan={3}
                      >
                        No systems with integrations detected yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Impact panel */}
          <section className="mt-10">
            <SystemImpactPanel
              impact={impact}
              loading={false}
              error={null}
              className="w-full"
            />
          </section>
        </>
      )}
    </div>
  );
}
