"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LivingMapData } from "@/types/livingMap";
import domainColors from "@/config/domainColors.json";

type LayoutMode = "sbgn" | "cose" | "dagre" | "concentric";

type CytoMapProps = {
  data: LivingMapData;
  height?: number;
  selectedNodeId?: string;
  onSelectNode?: (id: string | null) => void;
  searchTerm?: string;
};

export function CytoMap({
  data,
  height = 720,
  selectedNodeId,
  onSelectNode,
  searchTerm = "",
}: CytoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<any>(null);
  const [layout, setLayout] = useState<LayoutMode>("sbgn");

  const normalized = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filteredNodes = term
      ? (data.nodes ?? []).filter(
          (n) =>
            n.label?.toLowerCase().includes(term) ||
            (n.domain ?? "").toString().toLowerCase().includes(term),
        )
      : data.nodes ?? [];
    const keep = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = (data.edges ?? []).filter(
      (e) => keep.has(e.source) && keep.has(e.target),
    );
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [data, searchTerm]);

  const domainOrder = useMemo(() => {
    const present = Array.from(
      new Set((normalized.nodes ?? []).map((n) => (n.domain ?? "Other").toString())),
    );
    const lanes: Record<string, number> = {};
    let laneIdx = 0;
    present
      .filter((d) => d !== "Other")
      .sort()
      .forEach((d) => {
        lanes[d] = laneIdx++;
      });
    lanes["Other"] = laneIdx;
    return lanes;
  }, [normalized.nodes]);

  const elements = useMemo(() => {
    const nodes = (normalized.nodes ?? []).map((n) => {
      const domain = (n.domain ?? "Other").toString();
      const lane = domainOrder[domain] ?? domainOrder["Other"] ?? 0;
      return {
        data: {
          id: n.id,
          label: n.label,
          domain,
          parent: `domain-${domain}`,
          state: (n as any).state ?? "unchanged",
          confidence: (n as any).confidence ?? 0.6,
          lane,
          upstream: (n as any).upstreamCount ?? 0,
          downstream: (n as any).downstreamCount ?? 0,
        },
      };
    });
    const domainNodes = Array.from(new Set(nodes.map((n) => n.data.parent))).map((dId) => {
      const name = dId.replace(/^domain-/, "");
      return { data: { id: dId, label: name, isDomain: true } };
    });
    const edges = (normalized.edges ?? []).map((e, idx) => ({
      data: {
        id: e.id ?? `edge-${idx}`,
        source: e.source,
        target: e.target,
        edgeType: (e as any).state ?? ((e as any).inferred ? "inferred" : "derived"),
        confidence: (e as any).confidence ?? 0.6,
      },
    }));
    return [...domainNodes, ...nodes, ...edges];
  }, [normalized.edges, normalized.nodes, domainOrder]);

  useEffect(() => {
    let cy: any;
    async function init() {
      if (!containerRef.current) return;
      const cytoscape = (await import("cytoscape")).default;
      const dagre = (await import("cytoscape-dagre")).default;
      const coseBilkent = (await import("cytoscape-cose-bilkent")).default;
      const cola = (await import("cytoscape-cola")).default;
      const sbgnStyle = (await import("cytoscape-sbgn-stylesheet")).default;
      dagre(cytoscape);
      coseBilkent(cytoscape);
      cola(cytoscape);

      const baseStyle = [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#f8fafc",
            "background-opacity": (ele: any) => {
              const c = ele.data("confidence") ?? 0.6;
              return Math.max(0.35, Math.min(1, c));
            },
            "border-color": (ele: any) => {
              const d = ele.data("domain") || "Other";
              // @ts-ignore
              return domainColors[d] ?? domainColors["Other"] ?? "#cbd5e1";
            },
            "border-width": 1.5,
            width: 170,
            height: 64,
            "text-wrap": "wrap",
            "text-max-width": "150px",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "center",
            color: "#0f172a",
            shape: "round-rectangle",
          },
        },
        {
          selector: "node[isDomain]",
          style: {
            label: "data(label)",
            "background-color": (ele: any) => {
              const name = ele.data("label");
              const key = name in domainColors ? name : "Other";
              // @ts-ignore
              return domainColors[key] ?? "#e2e8f0";
            },
            "border-color": "#cbd5e1",
            "background-opacity": 0.12,
            shape: "round-rectangle",
            padding: "12px",
            "min-width": 420,
            "min-height": 280,
            "text-valign": "top",
            "text-halign": "center",
            "text-margin-y": -10,
            "font-size": "14px",
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "unbundled-bezier",
            "control-point-step-size": 60,
            width: 1.5,
            opacity: 0.85,
            "line-color": (ele: any) => {
              const t = ele.data("edgeType");
              if (t === "inferred") return "#a855f7";
              if (t === "unresolved") return "#fb923c";
              return "#94a3b8";
            },
            "line-style": (ele: any) => {
              const t = ele.data("edgeType");
              if (t === "inferred") return "dashed";
              if (t === "unresolved") return "dotted";
              return "solid";
            },
            "target-arrow-shape": "triangle",
            "target-arrow-color": (ele: any) => {
              const t = ele.data("edgeType");
              if (t === "inferred") return "#a855f7";
              if (t === "unresolved") return "#fb923c";
              return "#94a3b8";
            },
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#0f172a",
            "border-width": 2,
          },
        },
      ];

      let sbgnJson: any = baseStyle;
      try {
        const sbgn = sbgnStyle(cytoscape);
        if (Array.isArray(sbgn)) sbgnJson = sbgn;
      } catch {
        // fall back silently
      }

      const layoutConfig: any =
        layout === "dagre"
          ? { name: "dagre", rankDir: "TB", padding: 40 }
          : layout === "concentric"
          ? { name: "concentric", padding: 40 }
          : layout === "cose"
          ? { name: "cose-bilkent", padding: 40 }
          : {
              name: "cola",
              flow: { axis: "x", minSeparation: 200 },
              nodeSpacing: 80,
              avoidOverlap: true,
              nestingFactor: 1.1,
              animate: false,
              fit: true,
              edgeLengthVal: 220,
              spacingFactor: 1.6,
              nodeRepulsion: 5000,
              padding: 50,
            };

      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: sbgnJson,
        layout: layoutConfig,
      });

      cy.style().fromJson(baseStyle).update();

      const laneWidth = 360;
      cy.nodes()
        .filter((n: any) => !n.data("isDomain"))
        .forEach((n: any, idx: number) => {
          const lane = n.data("lane") ?? 0;
          const x = Math.round((lane * laneWidth + (idx % 6) * 28 + 60) / 20) * 20;
          const y = Math.round(((idx % 24) * 52 + 40) / 20) * 20;
          n.position({ x, y });
        });

      cy.once("layoutstop", () => cy.fit(cy.elements(), 50));

      cy.on("tap", "node", (evt: any) => {
        const id = evt.target.id();
        if (onSelectNode) onSelectNode(id);
      });

      cyRef.current = cy;
    }
    init();
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [elements, layout, domainOrder, onSelectNode]);

  useEffect(() => {
    const handler = () => {
      if (cyRef.current) {
        cyRef.current.fit(cyRef.current.elements(), 50);
      }
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!cyRef.current || !selectedNodeId) return;
    const cy = cyRef.current;
    cy.elements().unselect();
    const node = cy.getElementById(selectedNodeId);
    if (node) {
      node.select();
      cy.center(node);
    }
  }, [selectedNodeId]);

  const applyLayout = (mode: LayoutMode) => {
    setLayout(mode);
    if (!cyRef.current) return;
    const layoutCfg: any =
      mode === "dagre"
        ? { name: "dagre", rankDir: "TB", padding: 40 }
        : mode === "concentric"
        ? { name: "concentric", padding: 40 }
        : mode === "cose"
        ? { name: "cose-bilkent", padding: 40 }
        : {
            name: "cola",
            flow: { axis: "x", minSeparation: 200 },
            nodeSpacing: 80,
            avoidOverlap: true,
            nestingFactor: 1.1,
            animate: false,
            fit: true,
            edgeLengthVal: 220,
            spacingFactor: 1.6,
            nodeRepulsion: 5000,
            padding: 50,
          };
    cyRef.current.layout(layoutCfg).run();
  };

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="absolute right-3 top-3 z-10 flex gap-2 text-[11px]">
        {(["sbgn", "cose", "dagre", "concentric"] as LayoutMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => applyLayout(m)}
            className={
              "rounded-full border px-3 py-1 font-semibold " +
              (layout === m
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200")
            }
          >
            {m}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-3xl"
      />
    </div>
  );
}
