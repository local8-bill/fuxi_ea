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
  const zoomBy = (factor: number) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const current = cy.zoom();
    cy.zoom({
      level: current * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
    });
  };
  const fitView = () => {
    if (!cyRef.current) return;
    cyRef.current.fit(cyRef.current.elements(), 30);
  };

  const domainOrder = useMemo(() => {
    const canonical = ["Data", "Core Platform", "ERP", "MDM", "Integration", "Commerce", "CRM", "OMS", "Order Mgmt", "Experience", "Analytics"];
    const present = Array.from(new Set((graph.nodes ?? []).map((n) => (n.domain ?? "Other").toString())));
    const lanes: Record<string, number> = {};
    let laneIdx = 0;
    canonical.forEach((d) => {
      if (present.includes(d)) {
        lanes[d] = laneIdx++;
      }
    });
    present
      .filter((d) => !(d in lanes))
      .sort()
      .forEach((d) => {
        lanes[d] = laneIdx++;
      });
    if (!( "Other" in lanes)) lanes["Other"] = laneIdx;
    return lanes;
  }, [graph.nodes]);

  const elements = useMemo(() => {
    const nodes = (graph.nodes ?? []).map((n) => {
      const domain = (n.domain ?? "Other").toString();
      const lane = domainOrder[domain] ?? domainOrder["Other"] ?? 0;
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
      const sbgnStyle = (await import("cytoscape-sbgn-stylesheet")).default;
      dagre(cytoscape);
      coseBilkent(cytoscape);
      cola(cytoscape);
      const baseStyle = [
        {
          selector: "node",
          style: {
            "label": "data(label)",
            "background-color": "#f8fafc",
            "background-opacity": (ele: any) => {
              const c = ele.data("confidence") ?? 0.6;
              return Math.max(0.35, Math.min(1, c));
            },
            "border-color": (ele: any) => {
              const d = ele.data("domain") || "Other";
              // @ts-expect-error: domain color map is keyed by domain strings
              return domainColors[d] ?? domainColors["Other"] ?? "#cbd5e1";
            },
            "border-width": 1.5,
            "width": 170,
            "height": 64,
            "text-wrap": "wrap",
            "text-max-width": "150px",
            "font-size": "12px",
            "text-valign": "center",
            "text-halign": "center",
            "color": "#0f172a",
            "shape": "round-rectangle",
          },
        },
        {
          selector: "node[isDomain]",
          style: {
            "label": "data(label)",
            "background-color": (ele: any) => {
              const name = ele.data("label");
              const key = (name in domainColors ? name : "Other") as keyof typeof domainColors;
              return domainColors[key] ?? "#e2e8f0";
            },
            "border-color": "#cbd5e1",
            "background-opacity": 0.12,
            "shape": "round-rectangle",
            "padding": "12px" as any,
            "min-width": 420,
            "min-height": 280,
            "text-valign": "top",
            "text-halign": "center",
            "text-margin-y": -10 as any,
            "font-size": "14px",
          },
        },
        {
          selector: "edge",
          style: {
            "curve-style": "unbundled-bezier",
            "control-point-step-size": 60,
            "width": 1.5,
            "opacity": 0.85,
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
      ];
      let sbgnJson: any = baseStyle;
      try {
        const sbgn = sbgnStyle(cytoscape);
        if (Array.isArray(sbgn)) {
          sbgnJson = sbgn;
        }
      } catch (err) {
        console.warn("[CYTO] SBGN stylesheet failed, falling back to base style", err);
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
              nestingFactor: 1.2,
              animate: false,
              fit: true,
              edgeLengthVal: 240,
              spacingFactor: 1.9,
              nodeRepulsion: 6500,
              padding: 40,
            };

      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: sbgnJson,
        layout: layoutConfig,
      });
      // Apply tint/palette on top of the chosen stylesheet.
      cy.style().fromJson(baseStyle).update();
      cy.once("layoutstop", () => {
        cy.fit(cy.elements(), 30);
      });
      // Seed initial positions by domain lane to reinforce left-to-right flow.
      const laneWidth = 380;
      cy.nodes()
        .filter((n: any) => !n.data("isDomain"))
        .forEach((n: any, idx: number) => {
          const lane = n.data("lane") ?? 0;
          const x = Math.round((lane * laneWidth + (idx % 6) * 28 + 40) / 20) * 20;
          const y = Math.round(((idx % 24) * 52 + 40) / 20) * 20;
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
            nestingFactor: 1.2,
            animate: false,
            fit: true,
            edgeLengthVal: 240,
            spacingFactor: 1.9,
            nodeRepulsion: 6500,
            padding: 40,
          };
    cyRef.current.layout(layoutCfg).run();
    cyRef.current.once("layoutstop", () => {
      cyRef.current.fit(cyRef.current.elements(), 80);
    });
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
        <div className="ml-4 flex items-center gap-2">
          <button
            onClick={() => zoomBy(1.1)}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800"
          >
            + Zoom
          </button>
          <button
            onClick={() => zoomBy(0.9)}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800"
          >
            – Zoom
          </button>
          <button
            onClick={fitView}
            className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white"
          >
            Fit
          </button>
        </div>
      </div>
      <div ref={containerRef} style={{ height }} className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm" />
    </div>
  );
}
