"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useSimulationEngine } from "@/hooks/useSimulationEngine";
import type { LivingMapData } from "@/types/livingMap";
import "./ImpactGraph.css";
import "./xy-theme.css";

type LivingMapProps = {
  data: LivingMapData;
  height?: number;
  selectedNodeId?: string;
  onSelectNode?: (id: string) => void;
  searchTerm?: string;
};

const COLORS = {
  neutral: "#94a3b8",
  domains: {
    commerce: "#f97316",
    erp: "#f59e0b",
    crm: "#a855f7",
    data: "#0ea5e9",
    integration: "#22c55e",
    hr: "#6366f1",
    finance: "#0ea5e9",
    logistics: "#14b8a6",
    "core platform": "#0891b2",
    "order management": "#f472b6",
    other: "#94a3b8",
  },
};

const GroupNode = ({ data }: { data?: { label?: string } }) => (
  <div className="flex h-full w-full items-start justify-start p-2 text-[11px] font-semibold text-slate-500">
    <span className="rounded-full bg-white/80 px-2 py-0.5 shadow-sm border border-slate-200">
      {data?.label ?? "Group"}
    </span>
  </div>
);

const nodeTypes = { group: GroupNode };

function normalizeDomainValue(d?: string | null): string {
  const raw = (d ?? "").toString().trim();
  if (raw) return raw;
  return "Other";
}

export function LivingMap({ data, height = 760, selectedNodeId, onSelectNode }: LivingMapProps) {
  const { data: simData } = useSimulationEngine(data);

  const domainColors = useMemo(() => {
    const palette = COLORS.domains;
    const seen = new Map<string, string>();
    simData.nodes.forEach((n) => {
      const domain = normalizeDomainValue((n as any).domain);
      const key = domain || "Other";
      if (!seen.has(key)) {
        const color =
          (palette as any)[key.toLowerCase()] ??
          (palette as any)["other"] ??
          COLORS.neutral;
        seen.set(key, color);
      }
    });
    if (!seen.size) {
      seen.set("Other", (palette as any)["other"] ?? COLORS.neutral);
    }
    return seen;
  }, [simData.nodes]);

  const nodesToRender = useMemo(() => {
    const byDomain = new Map<string, any[]>();
    simData.nodes.forEach((n) => {
      const domain = normalizeDomainValue((n as any).domain);
      if (!byDomain.has(domain)) byDomain.set(domain, []);
      byDomain.get(domain)!.push(n);
    });

    const domains = Array.from(byDomain.keys()).sort((a, b) => (byDomain.get(b)?.length ?? 0) - (byDomain.get(a)?.length ?? 0));
    const cols = 3;
    const domainWidth = 420;
    const hGap = 300; // extra breathing room between domains
    const vGap = 320;
    const maxPerRow = 2; // fewer per row to reduce clutter

    const groupNodes: Node[] = [];
    const childNodes: Node[] = [];

    domains.forEach((domain, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const baseX = col * (domainWidth + hGap);
      const baseY = row * (domainWidth + vGap);

      const bucket = byDomain.get(domain) ?? [];
      const rowsNeeded = Math.max(1, Math.ceil(bucket.length / maxPerRow));
      const boxHeight = Math.max(rowsNeeded * 150 + 200, 600);

      groupNodes.push({
        id: `group-${domain}`,
        type: "group",
        position: { x: baseX, y: baseY },
        data: { label: domain },
        style: {
          width: domainWidth,
          height: boxHeight,
          backgroundColor: `${(domainColors.get(domain) ?? COLORS.neutral)}1A`,
          border: "1px solid #e2e8f0",
          borderRadius: 16,
        },
        draggable: false,
        selectable: false,
      });

      bucket.forEach((node, i) => {
        const localCol = i % maxPerRow;
        const localRow = Math.floor(i / maxPerRow);
        const label = (node as any).label ?? (node as any).name ?? node.id;
        const isSelected = selectedNodeId === node.id;
        childNodes.push({
          id: String(node.id),
          parentId: `group-${domain}`,
          extent: "parent",
          data: { label },
          position: {
            x: 30 + localCol * 180,
            y: 60 + localRow * 160,
          },
          style: {
            borderRadius: 12,
            padding: 10,
            border: isSelected ? "2px solid #94a3b8" : "1px solid #e2e8f0",
            background: "#fff",
            color: "#0f172a",
            boxShadow: "0 6px 14px rgba(15,23,42,0.08)",
            cursor: "pointer",
            maxWidth: domainWidth - 80,
            wordBreak: "break-word",
          },
        } as Node);
      });
    });

    return [...groupNodes, ...childNodes];
  }, [simData.nodes, domainColors, selectedNodeId]);

  const visibleNodeIds = useMemo(() => new Set(nodesToRender.filter((n) => n.type !== "group").map((n) => n.id)), [nodesToRender]);

  const edges = useMemo(() => {
    return (simData.edges ?? []).filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "bezier",
      style: {
        strokeWidth: 1.2,
        stroke: "#94a3b8",
        opacity: 0.55,
      },
    })) as Edge[];
  }, [simData.edges, visibleNodeIds]);

  return (
    <div className="w-full">
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" style={{ height }}>
        <ReactFlow
          nodes={nodesToRender as Node[]}
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          onNodeClick={(_, node) => onSelectNode?.(node.id)}
          defaultEdgeOptions={{ type: "bezier" }}
        >
          <Controls />
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>
    </div>
  );
}
