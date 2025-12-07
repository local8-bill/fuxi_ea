"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { LivingMap } from "@/components/LivingMap";
import type { LivingMapData, LivingNode } from "@/types/livingMap";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useUserGenome } from "@/lib/context/userGenome";
import { emitAdaptiveEvent } from "@/lib/adaptive/eventBus";

interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
}

type FlowStep = "domain" | "system" | "integration" | "insight";

interface Props {
  projectId: string;
}

const DIGITAL_TWIN_VERSION = "0.2";

const ACTIONS = [
  {
    key: "redundancy",
    title: "Analyze Redundancies",
    summary: "Surface overlapping systems and pathways adding unnecessary run costs.",
    cta: "Open Redundancy Map",
    href: (projectId: string) => `/project/${projectId}/experience?scene=digital&lens=redundancy`,
  },
  {
    key: "roi",
    title: "Assess ROI",
    summary: "Estimate ROI impact for this focus area and capture it as a scenario.",
    cta: "Open ROI Dashboard",
    href: (projectId: string) => `/project/${projectId}/experience?scene=roi`,
  },
  {
    key: "modernization",
    title: "Simulate Modernization",
    summary: "Model the impact of retiring or upgrading systems via the sequencer.",
    cta: "Open Sequencer",
    href: (projectId: string) => `/project/${projectId}/experience?scene=sequencer`,
  },
];

function formatNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return "0";
  return value.toLocaleString();
}

function stableScore(id: string, base: number, spread: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  return base + normalized * spread;
}

function buildLivingMapData(view: { nodes?: any[]; edges?: any[] }): LivingMapData {
  const nodes = Array.isArray(view.nodes) ? view.nodes : [];
  const edges = Array.isArray(view.edges) ? view.edges : [];
  const degree = new Map<string, number>();
  edges.forEach((edge: any) => {
    const src = edge?.sourceId ?? edge?.source;
    const tgt = edge?.targetId ?? edge?.target;
    if (src) degree.set(src, (degree.get(src) ?? 0) + 1);
    if (tgt) degree.set(tgt, (degree.get(tgt) ?? 0) + 1);
  });

  const livingNodes: LivingMapData["nodes"] = nodes.map((node: any) => {
    const id = String(node?.id ?? "");
    const label = String(node?.label ?? node?.name ?? "Unknown");
    return {
      id,
      label,
      domain: node?.domain ?? null,
      integrationCount: degree.get(id) ?? 0,
      state: node?.state,
      health: stableScore(id, 55, 30),
      aiReadiness: stableScore(`${id}-ai`, 45, 45),
      roiScore: stableScore(`${id}-roi`, 35, 50),
    };
  });

  const livingEdges: LivingMapData["edges"] = edges.map((edge: any, idx: number) => ({
    id: String(edge?.id ?? `edge-${idx}`),
    source: String(edge?.sourceId ?? edge?.source ?? ""),
    target: String(edge?.targetId ?? edge?.target ?? ""),
    weight: 1,
    kind: "api",
    confidence: typeof edge?.confidence === "number" ? edge.confidence : undefined,
    inferred: Boolean(edge?.data?.inferred || edge?.inferred),
  }));

  return { nodes: livingNodes, edges: livingEdges };
}

function buildInsight(role: string, motivation: string, systemName: string, peerName: string, tone: string) {
  const base = role.toLowerCase().includes("cfo")
    ? `From a finance lens, ${systemName} and ${peerName} create duplicate run costs.`
    : `The ${systemName} → ${peerName} path is carrying redundant flows.`;
  const toneSuffix = tone === "empathetic" ? " I can soften the rollout if you need." : tone === "analytical" ? " Let's quantify the delta next." : " Ready to act when you are.";
  return `${base} Aligning this connection accelerates ${motivation.toLowerCase()}.${toneSuffix}`;
}

export function DigitalEnterpriseClient({ projectId }: Props) {
  const { log: logTelemetry } = useTelemetry("digital_twin", { projectId });
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "1";
  const { role, motivation, interactionStyle, preferredTone } = useUserGenome();

  const [stats, setStats] = useState<DigitalEnterpriseStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const [graphData, setGraphData] = useState<LivingMapData | null>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  const [graphRevealed, setGraphRevealed] = useState(false);
  const [viewMode, setViewMode] = useState<"roi" | "risk" | "modernization">("roi");

  const [flowStep, setFlowStep] = useState<FlowStep>("domain");
  const flowStepRef = useRef<FlowStep>("domain");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<{ edgeId: string; peerLabel: string } | null>(null);
  const [insightMessage, setInsightMessage] = useState<string | null>(null);

  const aiInsights = useAIInsights(graphData?.nodes ?? []);

  const livingMapData = useMemo<LivingMapData>(() => {
    const fallback = graphData ?? { nodes: [], edges: [] };
    const safeNodes = ((fallback.nodes ?? []) as LivingNode[]).filter(Boolean);
    const enriched = safeNodes.map((node) => {
      const insight = aiInsights.insights[node.id];
      return {
        ...node,
        domain: insight?.domain ?? node.domain,
        aiReadiness: insight?.aiReadiness ?? node.aiReadiness,
        roiScore: insight?.opportunityScore ?? node.roiScore,
        disposition: insight?.disposition ?? node.disposition,
      };
    });
    return { nodes: enriched, edges: fallback.edges ?? [] };
  }, [graphData, aiInsights.insights]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    livingMapData.nodes.forEach((node) => {
      const key = ((node.domain as string) || "Other").trim() || "Other";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [livingMapData.nodes]);

  const domainSuggestions = useMemo(() => {
    const sorted = Object.entries(domainCounts)
      .filter(([domain]) => domain.toLowerCase() !== "unknown")
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .map(([domain]) => domain);
    return (sorted.length ? sorted.slice(0, 4) : ["Commerce", "Finance", "Supply Chain", "Order Management"]).map(
      (domain) => domain.charAt(0).toUpperCase() + domain.slice(1),
    );
  }, [domainCounts]);

  const selectedSystem = useMemo(() => livingMapData.nodes.find((node) => node.id === selectedSystemId) ?? null, [livingMapData.nodes, selectedSystemId]);

  const systemCandidates = useMemo(() => {
    if (!selectedDomain) return [];
    return livingMapData.nodes
      .filter((node) => (node.domain as string)?.toLowerCase() === selectedDomain.toLowerCase())
      .sort((a, b) => (b.integrationCount ?? 0) - (a.integrationCount ?? 0))
      .slice(0, 4);
  }, [livingMapData.nodes, selectedDomain]);

  const integrationCandidates = useMemo(() => {
    if (!selectedSystem) return [];
    return livingMapData.edges
      .filter((edge) => edge.source === selectedSystem.id || edge.target === selectedSystem.id)
      .slice(0, 4)
      .map((edge) => {
        const peerId = edge.source === selectedSystem.id ? edge.target : edge.source;
        const peer = livingMapData.nodes.find((node) => node.id === peerId);
        return {
          id: edge.id,
          label: peer?.label ?? "Unknown integration",
        };
      });
  }, [livingMapData.edges, livingMapData.nodes, selectedSystem]);

  const highlightNodeIds = useMemo(() => {
    if (selectedSystem) {
      const ids = new Set<string>([selectedSystem.id]);
      livingMapData.edges.forEach((edge) => {
        if (edge.source === selectedSystem.id) ids.add(edge.target);
        if (edge.target === selectedSystem.id) ids.add(edge.source);
      });
      return ids;
    }
    if (selectedDomain) {
      const ids = livingMapData.nodes
        .filter((node) => (node.domain as string)?.toLowerCase() === selectedDomain.toLowerCase())
        .map((node) => node.id);
      return ids.length ? new Set(ids) : null;
    }
    return null;
  }, [livingMapData.nodes, livingMapData.edges, selectedSystem, selectedDomain]);

  const focusPulse = useMemo(() => {
    if (!highlightNodeIds || !highlightNodeIds.size) return null;
    const integrations = livingMapData.edges.filter((edge) => highlightNodeIds.has(edge.source) && highlightNodeIds.has(edge.target)).length;
    return {
      systems: highlightNodeIds.size,
      integrations,
      overlap: Math.max(4, Math.round(integrations * 1.1)),
    };
  }, [highlightNodeIds, livingMapData.edges]);

  const hasStats = Boolean(stats);
  const hasGraph = (livingMapData.nodes.length ?? 0) > 0;

  useEffect(() => {
    logTelemetry("workspace_view", { projectId, version: DIGITAL_TWIN_VERSION });
  }, [projectId, logTelemetry]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`/api/digital-enterprise/stats?project=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Stats load failed ${res.status}: ${text}`);
      }
      const json = (await res.json()) as DigitalEnterpriseStats;
      setStats(json);
    } catch (err: any) {
      setStatsError(err?.message ?? "Failed to load digital twin metrics.");
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [projectId]);

  const loadGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(null);
    try {
      const res = await fetch(`/api/digital-enterprise/view?project=${encodeURIComponent(projectId)}&mode=all`, { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Graph load failed ${res.status}: ${text}`);
      }
      const json = await res.json();
      setGraphData(buildLivingMapData(json));
    } catch (err: any) {
      setGraphError(err?.message ?? "Failed to load graph data.");
      setGraphData(null);
    } finally {
      setGraphLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadStats();
    loadGraph();
  }, [loadStats, loadGraph]);

  useEffect(() => {
    if (!hasGraph || graphLoading) return;
    const timer = window.setTimeout(() => {
      setGraphRevealed(true);
      logTelemetry("digital_twin.graph_revealed", {
        nodes: livingMapData.nodes.length,
        edges: livingMapData.edges.length,
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [graphLoading, hasGraph, livingMapData.nodes.length, livingMapData.edges.length, logTelemetry]);

  useEffect(() => {
    emitAdaptiveEvent("ux_mode:set", { mode: "focus", step: flowStep });
  }, []);

  const advanceFlow = useCallback(
    (next: FlowStep) => {
      const prev = flowStepRef.current;
      if (prev === next) return;
      flowStepRef.current = next;
      setFlowStep(next);
      emitAdaptiveEvent("ux_mode:set", { mode: "focus", step: next });
      logTelemetry("twin_transition_complete", { from: prev, to: next, role });
    },
    [logTelemetry, role],
  );

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    setSelectedSystemId(null);
    setSelectedIntegration(null);
    setInsightMessage(null);
    logTelemetry("twin_focus_entered", { domain, role });
    advanceFlow("system");
  };

  const handleSystemSelect = (systemId: string) => {
    setSelectedSystemId(systemId);
    setSelectedIntegration(null);
    setInsightMessage(null);
    advanceFlow("integration");
  };

  const handleIntegrationSelect = (integrationId: string, peerLabel: string) => {
    if (!selectedSystem) return;
    setSelectedIntegration({ edgeId: integrationId, peerLabel });
    const message = buildInsight(role, motivation, selectedSystem.label, peerLabel, preferredTone);
    setInsightMessage(message);
    logTelemetry("twin_insight_generated", {
      system: selectedSystem.label,
      peer: peerLabel,
      role,
    });
    advanceFlow("insight");
  };

  const focusSummary = useMemo(() => {
    if (!selectedDomain) return "Pick a domain so I can compress the map for you.";
    if (!selectedSystem) return `Scanning ${selectedDomain}. Pick a system to zoom in.`;
    if (!selectedIntegration) return `Tracing ${selectedSystem.label}. Choose an adjacent integration to inspect.`;
    return `Highlighting ${selectedSystem.label} ↔ ${selectedIntegration.peerLabel}. Ready for the next move?`;
  }, [selectedDomain, selectedSystem, selectedIntegration]);

  const promptsByRole: Record<FlowStep, string> = {
    domain:
      interactionStyle === "narrative"
        ? `Let's ease in, ${role}. Which ecosystem should we study first?`
        : `Choose a domain to start compressing the map.`,
    system:
      interactionStyle === "narrative"
        ? "I spotlighted the busiest systems in that domain. Want to zoom into one?"
        : "Pick the system that feels most congested right now.",
    integration:
      interactionStyle === "narrative"
        ? "These connections carry most of the load. Which one should we interrogate?"
        : "Select the integration that needs clarity.",
    insight:
      interactionStyle === "narrative"
        ? "Here’s the insight I generated. Want me to route it somewhere?"
        : "Insight ready. Where should I send you next?",
  };

  const renderFlowButtons = () => {
    switch (flowStep) {
      case "domain":
        return (
          <div className="flex flex-wrap gap-2">
            {domainSuggestions.map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => handleDomainSelect(domain)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  selectedDomain === domain ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-900"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        );
      case "system":
        return (
          <div className="flex flex-wrap gap-2">
            {systemCandidates.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => handleSystemSelect(node.id)}
                className={`rounded-2xl border px-3 py-2 text-left text-xs ${
                  selectedSystemId === node.id ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50 hover:border-slate-900"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{node.label}</p>
                <p className="text-[0.7rem] text-slate-500">Connections: {node.integrationCount ?? 0}</p>
              </button>
            ))}
          </div>
        );
      case "integration":
        return (
          <div className="flex flex-wrap gap-2">
            {integrationCandidates.map((edge) => (
              <button
                key={edge.id}
                type="button"
                onClick={() => handleIntegrationSelect(edge.id, edge.label)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-xs hover:border-slate-900"
              >
                <p className="text-sm font-semibold text-slate-900">{edge.label}</p>
                <p className="text-[0.7rem] text-slate-500">Integration focus</p>
              </button>
            ))}
          </div>
        );
      case "insight":
      default:
        return insightMessage ? <p className="text-sm text-slate-800">{insightMessage}</p> : null;
    }
  };

  return (
    <div className={isEmbed ? "px-4 py-6" : "px-6 py-8"}>
      {statsError && (
        <div className="mb-4">
          <ErrorBanner message={statsError} onRetry={loadStats} />
        </div>
      )}
      {!isEmbed && (
        <WorkspaceHeader
          statusLabel="DIGITAL TWIN"
          title={`Digital Twin Experience · v${DIGITAL_TWIN_VERSION}`}
          description="Here’s the unified technology landscape — harmonized systems, integrations, and telemetry in one guided, conversational flow."
        />
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <Card className="space-y-3 border-slate-200 bg-white shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Recognition</p>
            <p className="text-sm text-slate-800">
              “Here’s the full picture — every system and integration you’ve shared, harmonized across your enterprise.”
            </p>
            {hasStats && (
              <div className="grid grid-cols-2 gap-2 text-[0.7rem] text-slate-600">
                <div>
                  <p className="text-slate-500">Systems</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.systemsFuture)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Integrations</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.integrationsFuture)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Domains</p>
                  <p className="text-slate-900 font-semibold text-base">{formatNumber(stats?.domainsDetected)}</p>
                </div>
                <div>
                  <p className="text-slate-500">View mode</p>
                  <p className="font-semibold text-slate-900 capitalize">{viewMode}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-4 border-emerald-200 bg-emerald-50">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-600">Guided focus</p>
              <p className="text-sm text-emerald-900">{promptsByRole[flowStep]}</p>
            </div>
            <p className="text-xs text-emerald-800">{focusSummary}</p>
            {renderFlowButtons()}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Digital Twin graph</p>
              <p className="text-xs text-slate-500">Fade-in reveals and progressive focus transitions.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>View Mode</span>
              <select
                className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm"
                value={viewMode}
                onChange={(event) => {
                  const next = event.target.value as typeof viewMode;
                  setViewMode(next);
                  logTelemetry("digital_twin.view_mode_changed", { mode: next });
                }}
              >
                <option value="roi">ROI</option>
                <option value="risk">Risk</option>
                <option value="modernization">Modernization</option>
              </select>
            </label>
          </div>

          {graphError && (
            <Card className="border-rose-200 bg-rose-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-rose-700">{graphError}</p>
                <button
                  type="button"
                  className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
                  onClick={loadGraph}
                >
                  Retry
                </button>
              </div>
            </Card>
          )}

          <div className={`rounded-3xl border border-slate-200 bg-white p-3 shadow-lg transition-opacity duration-700 ${graphRevealed ? "opacity-100" : "opacity-0"}`}>
            {graphLoading && <div className="py-36 text-center text-sm text-slate-500">Loading digital twin map…</div>}
            {!graphLoading && hasGraph && (
              <LivingMap data={livingMapData} height={isEmbed ? 520 : 680} highlightNodeIds={highlightNodeIds ?? undefined} dimOpacity={0.2} />
            )}
            {!graphLoading && !hasGraph && (
              <div className="py-20 text-center text-sm text-slate-500">No harmonized systems yet. Import data or run onboarding to populate the graph.</div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Systems" value={formatNumber(stats?.systemsFuture)} />
            <MetricCard label="Integrations" value={formatNumber(stats?.integrationsFuture)} />
            <MetricCard label="Domains" value={formatNumber(stats?.domainsDetected)} />
          </div>

          {flowStep === "insight" && insightMessage && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Action invitation</p>
              <div className="grid gap-3 md:grid-cols-3">
                {ACTIONS.map((action) => (
                  <Card key={action.key} className="flex flex-col justify-between border-slate-200">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{action.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logTelemetry("digital_twin.action_selected", { action: action.key, role });
                        window.location.href = action.href(projectId);
                      }}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      {action.cta}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 border-slate-200">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Telemetry Pulse</p>
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Readiness</p>
                <p className="text-2xl font-semibold text-slate-900">{hasStats ? Math.min(95, Math.round(58 + (stats?.systemsFuture ?? 40) / 4)) : 64}%</p>
                <p className="text-[0.7rem] text-slate-500">Graph fidelity + session stability</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Impact</p>
                <p className="text-2xl font-semibold text-slate-900">{hasStats ? Math.min(98, Math.round(60 + (stats?.integrationsFuture ?? 0) / 2.5)) : 72}%</p>
                <p className="text-[0.7rem] text-slate-500">Projected value of current focus</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Confidence</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {hasStats
                    ? Math.min(94, Math.round(58 + ((stats?.integrationsFuture ?? 1) / Math.max(1, stats?.systemsFuture ?? 1)) * 14))
                    : 62}%
                </p>
                <p className="text-[0.7rem] text-slate-500">Sensor coverage + telemetry freshness</p>
              </div>
            </div>
          </Card>

          {focusPulse && (
            <Card className="space-y-3 border-emerald-200 bg-white shadow-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-emerald-600">Focus Pulse</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  Systems highlighted: <span className="font-semibold">{focusPulse.systems}</span>
                </p>
                <p>
                  Integrations in lens: <span className="font-semibold">{focusPulse.integrations}</span>
                </p>
                <p>
                  Overlap index: <span className="font-semibold">{focusPulse.overlap}</span>
                </p>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
