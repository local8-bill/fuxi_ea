"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import domainColors from "@/config/domainColors.json";
import type { HarmonizedGraph } from "@/domain/services/harmonization";

type LayoutMode = "cose" | "dagre" | "concentric";

type CytoGraphProps = {
  graph: HarmonizedGraph;
  height?: number;
};

export function CytoGraph({ graph, height = 720 }: CytoGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<any>(null);
  const [layout, setLayout] = useState<LayoutMode>("cose");

  const elements = useMemo(() => {
    const nodes = (graph.nodes ?? []).map((n) => {
      const domain = (n.domain ?? "Other").toString();
      return {
        data: {
          id: n.id,
          label: n.label,
          domain,
          parent: `domain-${domain}`,
          state: n.state ?? "unchanged",
          confidence: n.confidence ?? 0.6,
        },
      };
    });
    const domainNodes = Array.from(
      new Set(nodes.map((n) => n.data.parent)),
    ).map((dId) => {
      const name = dId.replace(/^domain-/, "");
      return {
        data: {
          id: dId,
          label: name,
          isDomain: true,
        },
      };
    });
    const edges = (graph.edges ?? []).map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        edgeType: (e as any).state ?? "derived",
        confidence: e.confidence ?? 0.6,
      },
    }));
    return [...domainNodes, ...nodes, ...edges];
  }, [graph]);

  useEffect(() => {
    let cy: any;
    async function init() {
      if (!containerRef.current) return;
      const cytoscape = (await import("cytoscape")).default;
      const dagre = (await import("cytoscape-dagre")).default;
      const coseBilkent = (await import("cytoscape-cose-bilkent")).default;
      dagre(cytoscape);
      coseBilkent(cytoscape);
      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
              "background-color": (ele: any) => {
                const state = ele.data("state");
                switch (state) {
                  case "added":
                    return "#22c55e";
                  case "removed":
                    return "#ef4444";
                  case "modified":
                    return "#eab308";
                  default:
                    return "#94a3b8";
                }
              },
              "label": "data(label)",
              "font-size": "10px",
              "text-valign": "center",
              "text-halign": "center",
              "text-wrap": "wrap",
              "text-max-width": "120px",
              "color": "#0f172a",
              "border-width": 1,
              "border-color": "#e2e8f0",
            },
          },
          {
            selector: "node[isDomain]",
            style: {
              "background-color": (ele: any) => {
                const name = ele.data("label");
                const key = name in domainColors ? name : "Other";
                // @ts-ignore
                return domainColors[key] ?? "#e2e8f0";
              },
              "label": "data(label)",
              "font-size": "11px",
              "text-valign": "top",
              "text-halign": "center",
              "text-margin-y": "-8px",
              "padding": "10px",
              "border-width": 2,
              "border-color": "#cbd5e1",
              "background-opacity": 0.08,
              "shape": "round-rectangle",
            },
          },
          {
            selector: "edge",
            style: {
              "curve-style": "bezier",
              "width": 2,
              "line-color": (ele: any) => {
                const t = ele.data("edgeType");
                if (t === "inferred") return "#a855f7";
                if (t === "unresolved") return "#fb923c";
                return "#2563eb";
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
                return "#2563eb";
              },
            },
          },
        ],
        layout: layout === "dagre" ? { name: "dagre", rankDir: "TB" } : layout === "concentric" ? { name: "concentric" } : { name: "cose-bilkent" },
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
  }, [elements, layout]);

  const applyLayout = (mode: LayoutMode) => {
    setLayout(mode);
    if (!cyRef.current) return;
    const layoutCfg =
      mode === "dagre"
        ? { name: "dagre", rankDir: "TB" }
        : mode === "concentric"
        ? { name: "concentric" }
        : { name: "cose-bilkent" };
    cyRef.current.layout(layoutCfg).run();
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {(["cose", "dagre", "concentric"] as LayoutMode[]).map((m) => (
          <button
            key={m}
            onClick={() => applyLayout(m)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              layout === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div ref={containerRef} style={{ height }} className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}
