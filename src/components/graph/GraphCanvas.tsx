"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, type Edge, type Node, type ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import type { LivingEdge, LivingNode } from "@/types/livingMap";
import type { GraphFocus, GraphViewMode, GraphRevealStage } from "@/hooks/useGraphTelemetry";
import { useGraphTelemetry } from "@/hooks/useGraphTelemetry";
import { GraphNode, type GraphNodeData } from "./GraphNode";
import { GraphEdge, type GraphEdgeData } from "./GraphEdge";
import { GraphControls } from "./GraphControls";

const nodeTypes = { fuxiNode: GraphNode };
const edgeTypes = { fuxiEdge: GraphEdge };

type GraphSequenceItem = {
  id: string;
  system?: string;
  phase: string;
  region?: string;
  dependencies?: string[];
};

interface GraphCanvasProps {
  nodes: LivingNode[];
  edges: LivingEdge[];
  focus: GraphFocus;
  focusLabel?: string | null;
  focusSummary: string;
  viewMode: GraphViewMode;
  stage: GraphRevealStage;
  highlightNodeIds?: Set<string> | string[] | null;
  selectedNodeId?: string | null;
  onNodeSelect?: (id: string | null) => void;
  onViewModeChange?: (mode: GraphViewMode) => void;
  onStageChange?: (stage: GraphRevealStage) => void;
  height?: number | string;
  projectId?: string;
  sequence?: GraphSequenceItem[];
  scenarioPhase?: string | null;
  showIntegrationOverlay?: boolean;
  domainColumns?: number;
  systemColumns?: number;
  showCanvasControls?: boolean;
  domainWidth?: number;
  domainHorizontalGap?: number;
  domainVerticalGap?: number;
  domainPaddingX?: number;
  domainPaddingY?: number;
  systemCellHeight?: number;
  domainMinHeight?: number;
  systemColumnGap?: number;
  fitViewPadding?: number;
  systemDepthLimit?: number;
  expandedDomains?: Set<string> | string[] | null;
  domainIconMap?: Record<string, string>;
  fitViewKey?: string | number;
}

const DEFAULT_DOMAIN_WIDTH = 600;
const DEFAULT_HORIZONTAL_GAP = 120;
const DEFAULT_VERTICAL_GAP = 260;
const DEFAULT_CELL_HEIGHT = 260;
const DEFAULT_PADDING_X = 40;
const DEFAULT_PADDING_Y = 72;
const DEFAULT_DOMAIN_MIN_HEIGHT = 620;
const DEFAULT_SYSTEM_COLUMN_GAP = 16;
const DEFAULT_SYSTEM_DEPTH_LIMIT = 0;

function convertHighlight(value?: Set<string> | string[] | null) {
  if (!value) return null;
  if (value instanceof Set) return value;
  return new Set(value);
}

function normalizeDomainKey(value?: string | null) {
  if (!value) return "";
  return value.toLowerCase().trim();
}

function convertDomainSet(value?: Set<string> | string[] | null) {
  if (!value) return null;
  if (value instanceof Set) return new Set(Array.from(value).map((item) => normalizeDomainKey(item)));
  return new Set(value.map((item) => normalizeDomainKey(item)));
}

function buildElements(
  livingNodes: LivingNode[],
  livingEdges: LivingEdge[],
  viewMode: GraphViewMode,
  stage: GraphRevealStage,
  highlightSet: Set<string> | null,
  selectedNodeId: string | null | undefined,
  sequence: GraphSequenceItem[] | undefined,
  scenarioPhase: string | null | undefined,
  overlayActive: boolean,
  domainColumns = 3,
  systemColumns = 3,
  layout: {
    domainWidth?: number;
    horizontalGap?: number;
    verticalGap?: number;
    cellHeight?: number;
    paddingX?: number;
    paddingY?: number;
    domainMinHeight?: number;
    systemColumnGap?: number;
  } = {},
  extras: {
    systemDepthLimit?: number;
    expandedDomains?: Set<string> | null;
    domainIconMap?: Record<string, string>;
  } = {},
): { nodes: Node<GraphNodeData>[]; edges: Edge<GraphEdgeData>[] } {
  const {
    domainWidth = DEFAULT_DOMAIN_WIDTH,
    horizontalGap = DEFAULT_HORIZONTAL_GAP,
    verticalGap = DEFAULT_VERTICAL_GAP,
    cellHeight = DEFAULT_CELL_HEIGHT,
    paddingX = DEFAULT_PADDING_X,
    paddingY = DEFAULT_PADDING_Y,
    domainMinHeight = DEFAULT_DOMAIN_MIN_HEIGHT,
    systemColumnGap = DEFAULT_SYSTEM_COLUMN_GAP,
  } = layout;
  const {
    systemDepthLimit = DEFAULT_SYSTEM_DEPTH_LIMIT,
    expandedDomains = null,
    domainIconMap,
  } = extras;
  const sequenceLookup = new Map<
    string,
    {
      item: GraphSequenceItem;
      order: number;
    }
  >();
  if (sequence) {
    sequence.forEach((item, index) => {
      const key = item.system ?? item.id;
      if (!key) return;
      sequenceLookup.set(key, { item, order: index });
    });
  }
  const byDomain = new Map<string, LivingNode[]>();
  livingNodes.forEach((node) => {
    const key = (node.domain ?? "Other").toString().trim() || "Other";
    if (!byDomain.has(key)) byDomain.set(key, []);
    byDomain.get(key)!.push(node);
  });
  const domains = Array.from(byDomain.keys()).sort((a, b) => (byDomain.get(b)?.length ?? 0) - (byDomain.get(a)?.length ?? 0));
  const cols = Math.max(1, domainColumns);
  const showSystems = stage !== "orientation";
  const showEdges = stage === "connectivity" || stage === "insight";
  const nodes: Node<GraphNodeData>[] = [];
  const columnOffsets = Array.from({ length: cols }, () => 0);

  domains.forEach((domain, index) => {
    const col = index % cols;
    const baseX = col * (domainWidth + horizontalGap);
    const baseY = columnOffsets[col];
    const bucket = byDomain.get(domain) ?? [];
    const normalizedDomain = normalizeDomainKey(domain);
    const isExpanded = expandedDomains?.has(normalizedDomain) ?? false;
    const visibleSystems = !isExpanded && systemDepthLimit > 0 ? bucket.slice(0, systemDepthLimit) : bucket;
    const hiddenCount = bucket.length - visibleSystems.length;
    const rowsNeeded = Math.max(1, Math.ceil(visibleSystems.length / Math.max(1, systemColumns)));
    const headerAllowance = overlayActive ? 80 : 64;
    const topContentPadding = paddingY + headerAllowance;
    const bottomContentPadding = paddingY;
    const verticalPaddingTotal = topContentPadding + bottomContentPadding;
    const boxHeight = Math.max(rowsNeeded * cellHeight + verticalPaddingTotal, domainMinHeight);
    const domainIntegrationCount = bucket.reduce((sum, node) => sum + (node.integrationCount ?? 0), 0);
    const icon = domainIconMap?.[normalizedDomain] ?? domainIconMap?.default ?? null;

    nodes.push({
      id: `domain-${domain}`,
      type: "fuxiNode",
      position: { x: baseX, y: baseY },
      draggable: false,
      selectable: false,
      data: {
        label: domain,
        domain,
        variant: "domain",
        viewMode,
        overlay: overlayActive,
        integrationTotal: domainIntegrationCount,
        hiddenCount: hiddenCount > 0 ? hiddenCount : undefined,
        icon: icon ?? undefined,
      },
      style: { width: domainWidth, height: boxHeight, zIndex: 0 },
    });

    columnOffsets[col] = baseY + boxHeight + verticalGap;

    if (!showSystems) return;

    visibleSystems.forEach((node, nodeIndex) => {
      const columns = Math.max(1, systemColumns);
      const localCol = nodeIndex % columns;
      const localRow = Math.floor(nodeIndex / columns);
      const spacingX = (domainWidth - paddingX * 2 - systemColumnGap * (columns - 1)) / columns;
      const itemWidth = Math.max(140, spacingX);
      const rowOffset = 0;
      const sequenceInfo = sequenceLookup.get(node.id);
      const scenario = Boolean(scenarioPhase && sequenceInfo?.item.phase === scenarioPhase);
      const highlight = Boolean(highlightSet?.has(node.id) || selectedNodeId === node.id);
      const badges: GraphNodeData["badges"] = [];
      if (sequenceInfo) {
        badges.push({
          label: `#${sequenceInfo.order + 1} · ${sequenceInfo.item.phase.toUpperCase()}`,
          tone: "accent",
        });
        if (sequenceInfo.item.region) {
          badges.push({ label: sequenceInfo.item.region, tone: "muted" });
        }
      }
      const dependencyCount = sequenceInfo?.item.dependencies?.length ?? 0;
      if (dependencyCount) {
        badges.push({ label: `${dependencyCount} deps`, tone: "muted" });
      }
      nodes.push({
        id: node.id,
        type: "fuxiNode",
        parentId: `domain-${domain}`,
        extent: "parent",
        position: {
          x: paddingX + rowOffset + localCol * (itemWidth + systemColumnGap),
          y: topContentPadding + localRow * cellHeight,
        },
        draggable: false,
        selectable: true,
        selected: selectedNodeId === node.id,
        data: {
          label: node.label,
          domain,
          variant: "system",
          highlight,
          dimmed: Boolean(highlightSet && !highlight),
          scenario,
          badges,
          viewMode,
          overlay: overlayActive,
          metrics: {
            roi: node.roiScore ?? node.opportunityScore ?? null,
            tcc: node.costPerformanceRatio ?? null,
            readiness: node.aiReadiness ?? null,
            integrations: node.integrationCount ?? null,
            stage: node.disposition ?? null,
          },
          phaseLabel: sequenceInfo?.item.phase ?? null,
          stageLabel: node.disposition ?? null,
        },
        style: {
          width: itemWidth,
        },
      });
    });
  });

  const visibleIds = new Set(nodes.filter((node) => !node.id.startsWith("domain-")).map((node) => node.id));
  const edges: Edge<GraphEdgeData>[] = showEdges
    ? livingEdges
        .filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
        .map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "fuxiEdge",
          data: { highlight: Boolean(highlightSet?.has(edge.source) && highlightSet?.has(edge.target)) },
        }))
    : [];

  return { nodes, edges };
}

export function GraphCanvas({
  nodes: livingNodes,
  edges: livingEdges,
  focus,
  focusLabel,
  focusSummary,
  viewMode,
  stage,
  highlightNodeIds,
  selectedNodeId,
  onNodeSelect,
  onStageChange,
  onViewModeChange,
  height = 820,
  projectId,
  sequence,
  scenarioPhase,
  showIntegrationOverlay = true,
  domainColumns = 3,
  systemColumns = 3,
  showCanvasControls = true,
  domainWidth,
  domainHorizontalGap,
  domainVerticalGap,
  domainPaddingX,
  domainPaddingY,
  systemCellHeight,
  domainMinHeight,
  systemColumnGap,
  fitViewPadding = 0.1,
  systemDepthLimit,
  expandedDomains,
  domainIconMap,
  fitViewKey,
}: GraphCanvasProps) {
  const highlightSet = useMemo(() => convertHighlight(highlightNodeIds), [highlightNodeIds]);
  const mergedHighlightSet = useMemo(() => {
    if (!highlightSet || highlightSet.size === 0) return null;
    return new Set(highlightSet);
  }, [highlightSet]);
  const expandedDomainSet = useMemo(() => convertDomainSet(expandedDomains), [expandedDomains]);
  const elements = useMemo(
    () =>
      buildElements(
        livingNodes,
        livingEdges,
        viewMode,
        stage,
        mergedHighlightSet,
        selectedNodeId,
        sequence,
        scenarioPhase,
        showIntegrationOverlay,
        domainColumns,
        systemColumns,
        {
          domainWidth,
          horizontalGap: domainHorizontalGap,
          verticalGap: domainVerticalGap,
          cellHeight: systemCellHeight,
          paddingX: domainPaddingX,
          paddingY: domainPaddingY,
          domainMinHeight,
          systemColumnGap,
        },
        {
          systemDepthLimit,
          expandedDomains: expandedDomainSet,
          domainIconMap,
        },
      ),
    [
      livingNodes,
      livingEdges,
      viewMode,
      stage,
      mergedHighlightSet,
      selectedNodeId,
      sequence,
      scenarioPhase,
      showIntegrationOverlay,
      domainColumns,
      systemColumns,
      domainWidth,
      domainHorizontalGap,
      domainVerticalGap,
      domainPaddingX,
      domainPaddingY,
      systemCellHeight,
      domainMinHeight,
      systemColumnGap,
      systemDepthLimit,
      expandedDomainSet,
      domainIconMap,
    ],
  );
  const { trackInteraction } = useGraphTelemetry(projectId);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (!flowInstance) return;
    flowInstance.fitView({ padding: fitViewPadding, duration: 600 });
    const currentZoom = flowInstance.getZoom();
    if (currentZoom < 0.75) {
      flowInstance.zoomTo(0.75, { duration: 300 });
    }
  }, [flowInstance, fitViewPadding, fitViewKey, domainColumns, elements.nodes.length]);

  return (
    <div className="relative h-full rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-900/5" style={{ height }}>
      {focusLabel ? (
        <div className="pointer-events-none absolute left-6 top-4 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{focusLabel}</div>
      ) : null}
      {showIntegrationOverlay ? (
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          Integration overlay active
        </div>
      ) : null}
      {showCanvasControls ? (
        <GraphControls
          focus={focus}
          focusSummary={focusSummary}
          viewMode={viewMode}
          stage={stage}
          onStageChange={onStageChange}
          onViewModeChange={onViewModeChange}
        />
      ) : null}
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        fitView
        fitViewOptions={{ padding: fitViewPadding }}
        minZoom={0.35}
        maxZoom={1.5}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        panOnDrag
        selectionOnDrag={false}
        onMoveEnd={(_, viewport) => trackInteraction("panzoom", viewport)}
        onNodeClick={(_, node) => {
          trackInteraction("node_click", { node: node.id });
          onNodeSelect?.(node.id);
        }}
        onPaneClick={() => {
          trackInteraction("canvas_clear");
          onNodeSelect?.(null);
        }}
        onInit={(instance) => setFlowInstance(instance)}
        defaultEdgeOptions={{ type: "fuxiEdge" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="#e5e7eb" gap={24} />
      </ReactFlow>
    </div>
  );
}
