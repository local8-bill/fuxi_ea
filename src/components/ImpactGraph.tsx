"use client";

import React, { useMemo } from "react";
import ReactFlow, { Background, Controls, Node, Edge, useNodesState, useEdgesState, Position } from "reactflow";
import "reactflow/dist/style.css";
import "./ImpactGraph.css";

import type { ImpactGraphData } from "@/types/impactGraph";
import { applyDagreLayout } from "@/lib/graph/layout";

type ImpactGraphProps = {
  graph: ImpactGraphData;
  height?: number;
  colorMode?: "domain" | "impact";
  showEdgeLabels?: boolean;
  weightEdges?: boolean;
  layout?: "flow" | "dagre";
};

const NODE_COLORS = ["#2563eb", "#9333ea", "#0ea5e9", "#1e293b", "#334155", "#64748b"];

function domainColor(domain: string | null | undefined) {
  if (!domain) return "#2563eb";
  const idx = Math.abs(hashString(domain)) % NODE_COLORS.length;
  return NODE_COLORS[idx];
}

function impactColor(impactScore?: number) {
  const v = Math.max(0, Math.min(100, impactScore ?? 0));
  if (v >= 80) return "#0ea5e9";
  if (v >= 60) return "#2563eb";
  if (v >= 40) return "#475569";
  return "#cbd5e1";
}

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function ImpactGraph({ graph, height = 720, colorMode = "domain", showEdgeLabels = false, weightEdges = true, layout = "flow" }: ImpactGraphProps) {
  const baseNodes: Node[] = graph.nodes.map((n, idx) => ({
    id: n.id,
    data: {
      label: n.label,
      impact: n.impactScore ?? 0,
      readiness: n.readiness ?? 0,
    },
    position: {
      x: 150 * (idx % 3),
      y: 120 * Math.floor(idx / 3),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      borderRadius: 12,
      padding: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
      color: "#0f172a",
      boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
    },
  }));

  const baseEdges: Edge[] = graph.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: showEdgeLabels && e.weight ? `${e.weight.toFixed(1)} links` : undefined,
    style: {
      strokeWidth: weightEdges ? Math.min(6, Math.max(2, e.weight ?? 2)) : 2,
      stroke: "#94a3b8",
    },
    animated: false,
    type: "default",
  }));

  const [nodes, , onNodesChange] = useNodesState(baseNodes);
  const [edges, , onEdgesChange] = useEdgesState(baseEdges);

  const graphNodeMap = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph.nodes]);
  const edgeWeightMap = useMemo(() => new Map(graph.edges.map((edge) => [edge.id, edge.weight ?? 0])), [graph.edges]);

  const laidOutNodes = useMemo<Node[]>(() => {
    if (layout !== "dagre") return nodes;
    return applyDagreLayout(nodes, edges).nodes as Node[];
  }, [layout, nodes, edges]);

  const coloredNodes = useMemo(() => {
    return laidOutNodes.map((node) => {
      const base = graphNodeMap.get(node.id);
      const color = colorMode === "domain" ? domainColor(base?.domain) : impactColor(base?.impactScore);
      return {
        ...node,
        style: {
          ...node.style,
          border: `1px solid ${color}`,
          boxShadow: `0 6px 14px ${color}1a`,
        },
      };
    });
  }, [laidOutNodes, graphNodeMap, colorMode]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const weight = edgeWeightMap.get(edge.id) ?? 0;
      return {
        ...edge,
        label: showEdgeLabels && weight ? `${weight.toFixed(1)} links` : undefined,
        style: {
          ...edge.style,
          strokeWidth: weightEdges ? Math.min(6, Math.max(2, weight || 2)) : 2,
          stroke: "#94a3b8",
        },
      };
    });
  }, [edges, edgeWeightMap, showEdgeLabels, weightEdges]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ height }}>
      {graph.nodes.length === 0 ? (
        <div className="p-4 text-sm text-slate-600">No dependency data available.</div>
      ) : (
        <ReactFlow
          nodes={coloredNodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <Background gap={16} color="#e2e8f0" />
        </ReactFlow>
      )}
    </div>
  );
}
