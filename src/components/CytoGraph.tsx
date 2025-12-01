"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import domainColors from "@/config/domainColors.json";
import type { HarmonizedGraph } from "@/domain/services/harmonization";

type LayoutMode = "sbgn" | "cose" | "dagre" | "concentric";

type CytoGraphProps = {
  graph: HarmonizedGraph;
  height?: number;
};

export function CytoGraph({ graph, height = 720 }: CytoGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<any>(null);
  const [layout, setLayout] = useState<LayoutMode>("sbgn");

  const domainOrder = useMemo(
    () => ["Data", "Core Platform", "ERP", "MDM", "Integration", "Commerce", "CRM", "OMS", "Experience", "Analytics"],
    [],
  );

  const elements = useMemo(() => {
    const nodes = (graph.nodes ?? []).map((n) => {
      const domain = (n.domain ?? "Other").toString();
      const lane = domainOrder.indexOf(domain);
      return {
        data: {
          id: n.id,
          label: n.label,
          domain,
          parent: `domain-${domain}`,
          state: n.state ?? "unchanged",
          confidence: n.confidence ?? 0.6,
          lane,
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
      const cola = (await import("cytoscape-cola")).default;
      dagre(cytoscape);
      coseBilkent(cytoscape);
      cola(cytoscape);
      const layoutConfig: any =
        layout === "dagre"
          ? { name: "dagre", rankDir: "TB" }
          : layout === "concentric"
          ? { name: "concentric" }
          : layout === "cose"
          ? { name: "cose-bilkent" }
          : {
              name: "cola",
              flow: { axis: "x", minSeparation: 180 },
              nodeSpacing: 60,
              avoidOverlap: true,
              animate: false,
              fit: true,
            };

      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: "node",
            style: {
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
              "border-width": 2,
              "label": "data(label)",
              "font-size": "10px",
              "text-valign": "center",
              "text-halign": "center",
              "text-wrap": "wrap",
              "text-max-width": "120px",
              "color": "#0f172a",
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
              // @ts-ignore text-margin-y accepts numeric offset
              "text-margin-y": -8,
              // @ts-ignore padding supports px shorthand
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
              "curve-style": "taxi",
              "taxi-direction": "horizontal",
              "width": 1.5,
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
        ],
        layout: layoutConfig,
      });
      // Seed initial positions by domain lane to reinforce left-to-right flow.
      const laneWidth = 260;
      cy.nodes()
        .filter((n: any) => !n.data("isDomain"))
        .forEach((n: any, idx: number) => {
          const lane = n.data("lane");
          const x = (lane >= 0 ? lane : domainOrder.length) * laneWidth + (idx % 5) * 10;
          const y = (idx % 20) * 40;
          n.position({ x, y });
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
  }, [elements, layout, domainOrder]);

  const applyLayout = (mode: LayoutMode) => {
    setLayout(mode);
    if (!cyRef.current) return;
    const layoutCfg: any =
      mode === "dagre"
        ? { name: "dagre", rankDir: "TB" }
        : mode === "concentric"
        ? { name: "concentric" }
        : mode === "cose"
        ? { name: "cose-bilkent" }
        : { name: "cola", flow: { axis: "x", minSeparation: 180 }, nodeSpacing: 60, avoidOverlap: true, animate: false, fit: true };
    cyRef.current.layout(layoutCfg).run();
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {(["sbgn", "cose", "dagre", "concentric"] as LayoutMode[]).map((m) => (
          <button
            key={m}
            onClick={() => applyLayout(m)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              layout === m ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {m === "sbgn" ? "SBGN" : m}
          </button>
        ))}
      </div>
      <div ref={containerRef} style={{ height }} className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}
