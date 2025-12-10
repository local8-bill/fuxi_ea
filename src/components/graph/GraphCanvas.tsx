"use client";

import { useMemo } from "react";
import ReactFlow, { Background, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { LivingEdge, LivingNode } from "@/types/livingMap";
import type { GraphFocus, GraphViewMode, GraphRevealStage } from "@/hooks/useGraphTelemetry";
import { useGraphTelemetry } from "@/hooks/useGraphTelemetry";
import { useGraphNarration } from "@/hooks/useGraphNarration";
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
  height?: number;
  projectId?: string;
  sequence?: GraphSequenceItem[];
  scenarioPhase?: string | null;
}

const domainWidth = 520;
const horizontalGap = 200;
const verticalGap = 340;
const maxPerRow = 3;
const cellHeight = 120;
const paddingX = 32;
const paddingY = 48;

function convertHighlight(value?: Set<string> | string[] | null) {
  if (!value) return null;
  if (value instanceof Set) return value;
  return new Set(value);
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
): { nodes: Node<GraphNodeData>[]; edges: Edge<GraphEdgeData>[] } {
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
  const cols = 3;
  const showSystems = stage !== "orientation";
  const showEdges = stage === "connectivity" || stage === "insight";
  const nodes: Node<GraphNodeData>[] = [];

  domains.forEach((domain, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const baseX = col * (domainWidth + horizontalGap);
    const baseY = row * (domainWidth + verticalGap);
    const bucket = byDomain.get(domain) ?? [];
    const rowsNeeded = Math.max(1, Math.ceil(bucket.length / maxPerRow));
    const boxHeight = Math.max(rowsNeeded * cellHeight + paddingY * 2, 620);

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
      },
      style: { width: domainWidth, height: boxHeight, zIndex: 0 },
    });

    if (!showSystems) return;

    bucket.forEach((node, nodeIndex) => {
      const localCol = nodeIndex % maxPerRow;
      const localRow = Math.floor(nodeIndex / maxPerRow);
      const columnsThisRow = Math.min(maxPerRow, bucket.length - localRow * maxPerRow);
      const spacingX = (domainWidth - paddingX * 2) / maxPerRow;
      const rowOffset = ((maxPerRow - columnsThisRow) * spacingX) / 2;
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
          x: paddingX + rowOffset + localCol * spacingX,
          y: paddingY + localRow * cellHeight,
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
         metrics: {
           roi: node.roiScore ?? node.opportunityScore ?? null,
            readiness: node.aiReadiness ?? null,
            integrations: node.integrationCount ?? null,
            stage: node.disposition ?? null,
          },
        },
        style: {
          width: spacingX - 16,
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
}: GraphCanvasProps) {
  const highlightSet = useMemo(() => convertHighlight(highlightNodeIds), [highlightNodeIds]);
  const elements = useMemo(
    () => buildElements(livingNodes, livingEdges, viewMode, stage, highlightSet, selectedNodeId, sequence, scenarioPhase),
    [livingNodes, livingEdges, viewMode, stage, highlightSet, selectedNodeId, sequence, scenarioPhase],
  );
  const { trackInteraction } = useGraphTelemetry(projectId);
  const narration = useGraphNarration({ focus, focusLabel, viewMode, stage });

  return (
    <div className="relative rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-slate-900/5" style={{ height }}>
      <GraphControls
        focus={focus}
        focusSummary={focusSummary}
        viewMode={viewMode}
        stage={stage}
        onStageChange={onStageChange}
        onViewModeChange={onViewModeChange}
      />
      <ReactFlow
        nodes={elements.nodes}
        edges={elements.edges}
        fitView
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
        defaultEdgeOptions={{ type: "fuxiEdge" }}
        style={{ width: "100%", height: "100%" }}
      >
        <Background color="#e2e8f0" gap={24} />
      </ReactFlow>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-2 text-xs text-slate-600 shadow">EAgent · {narration}</div>
      </div>
    </div>
  );
}
