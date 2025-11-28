"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import {
  SystemImpactPanel,
  type SystemImpact,
} from "@/components/digital-enterprise/SystemImpactPanel";
import { useImpactGraph } from "@/hooks/useImpactGraph";
import { LivingMap } from "@/components/LivingMap";
import type { LivingMapData } from "@/types/livingMap";
import { useROISimulation } from "@/hooks/useROISimulation";
import { ROIChart } from "@/components/ROIChart";
import { EventLogPanel } from "@/components/EventLogPanel";
import { useAIInsights } from "@/hooks/useAIInsights";
import { NodeInsightPanel } from "@/components/NodeInsightPanel";
import { ScenarioComparePanel } from "@/components/ScenarioComparePanel";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

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
  const telemetry = useTelemetry("digital_enterprise", { projectId });
  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [graphDepth, setGraphDepth] = useState<"domains" | "systems" | "integrations">("domains");
  const [autoCollapsed, setAutoCollapsed] = useState(false);
  const retryAfterRef = useRef<number>(0);

  const [impact, setImpact] = useState<SystemImpact | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const graph = useImpactGraph();
  const aiInsights = useAIInsights(graph.nodes);
  const livingMapData: LivingMapData = useMemo(() => {
    const dispositions: Array<NonNullable<LivingMapData["nodes"][number]["disposition"]>> = [
      "keep",
      "modernize",
      "replace",
      "retire",
    ];
    return {
      nodes: graph.nodes.map((n, idx) => {
        const insight = aiInsights.insights[n.id];
        return {
          id: n.id,
          label: n.label,
          domain: insight?.domain ?? n.domain,
          health: 60 + Math.random() * 30,
          aiReadiness: insight?.aiReadiness ?? 50 + Math.random() * 40,
          opportunityScore: insight?.opportunityScore,
          riskScore: insight?.riskScore,
          roiScore: 40 + Math.random() * 50,
          aiSummary: insight?.summary,
          disposition: (insight?.disposition as any) ?? dispositions[idx % dispositions.length],
          integrationCount: insight?.integrationCount ?? n.integrationCount,
        };
      }),
      edges: graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        weight: e.weight,
        kind: "api",
      })),
    };
  }, [graph]);

  const roiSim = useROISimulation();

  const loadStats = useCallback(async () => {
    const now = Date.now();
    if (now < retryAfterRef.current) {
      return;
    }
    const started = performance.now();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[DE-PAGE] Failed to load stats", res.status, text);
        if (res.status === 429) {
          let retryAfterMs = 60000;
          try {
            const parsed = JSON.parse(text);
            if (parsed?.retryAfterMs) {
              retryAfterMs = Number(parsed.retryAfterMs) || retryAfterMs;
            }
          } catch {
            // ignore JSON parse errors
          }
          retryAfterRef.current = Date.now() + retryAfterMs;
          setError(`Rate limited. Retrying in ${Math.round(retryAfterMs / 1000)}s.`);
        } else {
          setError("Failed to load digital enterprise metrics.");
        }
        setStats(null);
        telemetry.log("graph_load_error", {
          status: res.status,
          body: text,
        });
        return;
      }

      const json = (await res.json()) as DigitalEnterpriseStats;
      setStats(json);
      setError(null);
      telemetry.log("graph_load", {
        systems: json.systemsFuture,
        integrations: json.integrationsFuture,
        domains: json.domainsDetected,
        duration_ms: Math.round(performance.now() - started),
      });
    } catch (err: any) {
      console.error("[DE-PAGE] Error loading stats", err);
      setError("Failed to load digital enterprise metrics.");
      setStats(null);
      telemetry.log("graph_load_error", { message: (err as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, [projectId, telemetry]);

  useEffect(() => {
    telemetry.log("workspace_view", { projectId });
    loadStats();
  }, [projectId, telemetry, loadStats]);

  useEffect(() => {
    if (!stats) return;
    const denseGraph =
      (stats.systemsFuture ?? 0) > 50 || (stats.integrationsFuture ?? 0) > 80;
    setAutoCollapsed(denseGraph);
    setGraphDepth(denseGraph ? "domains" : "systems");
  }, [stats]);


  const hasData =
    !!stats &&
    ((stats.systemsFuture ?? 0) > 0 ||
      (stats.integrationsFuture ?? 0) > 0);

  const selectedNode = useMemo(
    () => livingMapData.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [livingMapData.nodes, selectedNodeId]
  );

  function handleSelectSystem(name: string, degree: number) {
    // For now, we mock upstream/downstream split.
    // Backend traversal will replace this logic later.
    const upstreamCount = Math.max(0, Math.floor(degree / 2));
    const downstreamCount = Math.max(0, degree - upstreamCount);
    telemetry.log("node_click", { name, degree });

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
      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={loadStats} /></div>}
      <WorkspaceHeader
        statusLabel="DIGITAL ENTERPRISE"
        title={`Ecosystem View for Project: ${projectId || "(unknown)"}`}
        description="These metrics are derived directly from your Lucid architecture diagram. We count unique systems that participate in at least one connection and their integrations."
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <p className="text-[0.7rem] text-slate-500">Layer view:</p>
        {(["domains", "systems", "integrations"] as const).map((depth) => (
          <button
            key={depth}
            type="button"
            onClick={() => setGraphDepth(depth)}
            className={
              "rounded-full border px-3 py-1 text-[0.7rem] font-semibold " +
              (graphDepth === depth
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-slate-100 text-slate-700 border-slate-200")
            }
          >
            {depth === "domains"
              ? "Domains"
              : depth === "systems"
              ? "Systems"
              : "Integrations"}
          </button>
        ))}
        {autoCollapsed && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[0.7rem] font-medium text-amber-800">
            Dense graph — domains collapsed
          </span>
        )}
      </div>

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
          <h2 className="text-sm font-semibold mb-1">LIVING MAP (BETA)</h2>
          <p className="text-xs text-gray-500 mb-4">
            Interactive upstream/downstream view; simulate and color by health/AI readiness/redundancy.
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold">Search</span>
              <input
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
                placeholder="System or domain"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Edge kinds:</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#2563eb" }} />API</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#22c55e" }} />Data</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#9333ea" }} />Workflow</span>
            <span className="fx-pill"><span className="fx-legend-dot" style={{ backgroundColor: "#94a3b8" }} />Manual/Other</span>
          </div>
          <LivingMap
            data={livingMapData}
            height={720}
            selectedNodeId={selectedNodeId ?? undefined}
            onSelectNode={setSelectedNodeId}
            searchTerm={search}
          />
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <label className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Timeline (months)</span>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={roiSim.month}
                    onChange={(e) => roiSim.setMonth(Number(e.target.value))}
                  />
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-800">
                    {roiSim.month}
                  </span>
                </label>
              </div>
              <NodeInsightPanel node={selectedNode} />
            </div>
          </section>

          {/* ROI + Events */}
          <section className="mt-12 grid gap-4 lg:grid-cols-[2fr,1fr]">
            <ROIChart
              data={roiSim.timeline}
              breakEvenMonth={roiSim.breakEvenMonth}
              currentMonth={roiSim.month}
            />
            <EventLogPanel events={roiSim.filteredEvents} />
          </section>

          {/* Scenario Compare (beta) */}
          <section className="mt-12">
            <ScenarioComparePanel
              baseline={{
                systems: stats.systemsFuture ?? 0,
                integrations: stats.integrationsFuture ?? 0,
              }}
              roiSignal={roiSim.breakEvenMonth}
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
