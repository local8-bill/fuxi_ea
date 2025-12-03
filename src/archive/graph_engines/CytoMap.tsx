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
  showUnchanged?: boolean;
  visibleNodeIds?: Set<string>;
  visibleEdgeIds?: Set<string>;
};

// Class helpers
const cls = {
  hidden: "fx-hidden",
  added: "fx-added",
  removed: "fx-removed",
  modified: "fx-modified",
  unchanged: "fx-unchanged",
};

export function CytoMap({
  data,
  height = 720,
  selectedNodeId,
  onSelectNode,
  searchTerm = "",
  showUnchanged = false,
}: CytoMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<any>(null);
  const [layout] = useState<LayoutMode>("cose");
  const [layingOut, setLayingOut] = useState<boolean>(true);
  const layoutRunningRef = useRef(false);
  const initialFitDone = useRef(false);
  const prevShowUnchanged = useRef<boolean>(false);

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

  const degreeMap = useMemo(() => {
    const deg = new Map<string, number>();
    normalized.edges.forEach((e) => {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    });
    return deg;
  }, [normalized.edges]);

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

  // Build elements once per data change; we diff against the existing cy instance.
  const effectiveShowUnchanged = true;

  const elements = useMemo(() => {
    const nodes = (normalized.nodes ?? [])
      .sort((a, b) => (degreeMap.get(b.id) ?? 0) - (degreeMap.get(a.id) ?? 0))
      .map((n, idx) => {
        const domain = (n.domain ?? "Other").toString();
        const lane = domainOrder[domain] ?? domainOrder["Other"] ?? 0;
        const state = (n as any).state ?? "unchanged";
        return {
          group: "nodes",
          data: {
            id: n.id,
            label: n.label,
            domain,
            parent: `domain-${domain}`,
            state,
            confidence: (n as any).confidence ?? 0.6,
            lane,
            upstream: (n as any).upstreamCount ?? 0,
            downstream: (n as any).downstreamCount ?? 0,
            degree: degreeMap.get(n.id) ?? 0,
          },
          // Seed positions left->right by degree; small spread to reduce initial jump.
          position: {
            x: lane * 320 + (idx % 6) * 22 + 60,
            y: (idx % 24) * 46 + 80,
          },
          classes: !effectiveShowUnchanged && state === "unchanged" ? cls.hidden : undefined,
        };
      });
    const domainNodes = Array.from(new Set(nodes.map((n) => n.data.parent))).map((dId) => {
      const name = dId.replace(/^domain-/, "");
      return {
        group: "nodes",
        data: { id: dId, label: name, isDomain: true },
      };
    });
    const edges = (normalized.edges ?? []).map((e, idx) => ({
      group: "edges",
      data: {
        id: e.id ?? `edge-${idx}`,
        source: e.source,
        target: e.target,
        edgeType: (e as any).state ?? ((e as any).inferred ? "inferred" : "derived"),
        confidence: (e as any).confidence ?? 0.6,
      },
    }));
    return [...domainNodes, ...nodes, ...edges];
  }, [normalized.nodes, normalized.edges, domainOrder, degreeMap]);

  // Build style once.
  const baseStyle = useMemo(
    () => [
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
          "min-width": 320,
          "min-height": 220,
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
      { selector: `.${cls.hidden}`, style: { opacity: 0, "pointer-events": "none" } },
      { selector: `.${cls.added}`, style: { "border-color": "#22c55e", "border-width": 2, "background-opacity": 0.6 } },
      { selector: `.${cls.removed}`, style: { "border-color": "#f43f5e", "border-width": 2, "opacity": 0.4 } },
      { selector: `.${cls.modified}`, style: { "border-color": "#f59e0b", "border-width": 2 } },
      { selector: `.${cls.unchanged}`, style: { "border-color": "#cbd5e1" } },
    ],
    [],
  );

  // Initialize once
  useEffect(() => {
    let cy: any;
    async function init() {
      if (!containerRef.current) return;
      setLayingOut(true);
      const cytoscape = (await import("cytoscape")).default;
      const dagre = (await import("cytoscape-dagre")).default;
      const coseBilkent = (await import("cytoscape-cose-bilkent")).default;
      const cola = (await import("cytoscape-cola")).default;
      dagre(cytoscape);
      coseBilkent(cytoscape);
      cola(cytoscape);

      cy = cytoscape({
        container: containerRef.current,
        elements,
        style: baseStyle,
        layout: { name: "cose-bilkent", padding: 30 },
      });

      cy.nodes()
        .filter((n: any) => !n.data("isDomain"))
        .forEach((n: any) => {
          // positions already seeded via elements; no-op
          return n;
        });

      cy.once("layoutstop", () => {
        if (layoutRunningRef.current) return;
        cy.fit(cy.elements(), 20);
        setLayingOut(false);
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // init once

  // Update elements without recreating instance
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Remove missing nodes/edges
    const incomingIds = new Set(elements.map((el) => el.data.id));
    cy.elements().forEach((el: any) => {
      if (!incomingIds.has(el.id())) el.remove();
    });

    // Add or update nodes/edges
    elements.forEach((el) => {
      const existing = cy.getElementById(el.data.id);
      if (existing && existing.length) {
        existing.data(el.data);
      } else {
        cy.add(el);
      }
    });

    // Seed positions for new nodes (already in data)
    cy.nodes()
      .filter((n: any) => !n.data("isDomain"))
      .forEach((n: any) => {
        if (!n.renderedPosition()) {
          const lane = n.data("lane") ?? 0;
          const deg = n.data("degree") ?? 0;
          n.position({
            x: lane * 320 + deg * 8 + 60,
            y: deg * 4 + 80,
          });
        }
      });

    const hiddenNodes = new Set<string>();
    // Apply classes based on state for highlight/visibility
    cy.nodes().forEach((n: any) => {
      n.removeClass([cls.added, cls.removed, cls.modified, cls.unchanged, cls.hidden]);
        const state = n.data("state") || "unchanged";
        const isUnchanged = state === "unchanged";
    if (visibleNodeIds && visibleNodeIds.size > 0 && !visibleNodeIds.has(n.id())) {
      n.addClass(cls.hidden);
      hiddenNodes.add(n.id());
      return;
    }
        if (!effectiveShowUnchanged && isUnchanged) {
          n.addClass(cls.hidden);
          hiddenNodes.add(n.id());
          return;
        }
      if (state === "added") n.addClass(cls.added);
      else if (state === "removed") n.addClass(cls.removed);
      else if (state === "modified") n.addClass(cls.modified);
      else n.addClass(cls.unchanged);
    });

    cy.edges().forEach((e: any) => {
      e.removeClass([cls.hidden, cls.added, cls.removed, cls.modified, cls.unchanged]);
      const state = e.data("edgeType");
      if (visibleEdgeIds && visibleEdgeIds.size > 0 && !visibleEdgeIds.has(e.id())) {
        e.addClass(cls.hidden);
        return;
      }
      if (hiddenNodes.has(e.data("source")) || hiddenNodes.has(e.data("target"))) {
        e.addClass(cls.hidden);
        return;
      }
      if (state === "unresolved") e.addClass(cls.removed);
      else if (state === "inferred") e.addClass(cls.modified);
      else e.addClass(cls.unchanged);
    });

    // No re-layout here; keep positions. Optionally refit lightly.
    // If showing unchanged, line them up in a grid below the main content.
    if (showUnchanged) {
      const unchanged = cy.nodes().filter((n: any) => n.data("state") === "unchanged" && !n.data("isDomain"));
      const others = cy.nodes().filter((n: any) => n.data("state") !== "unchanged" || n.data("isDomain"));
      const bbox = others.boundingBox();
      const startY = (bbox?.y2 ?? 0) + 160;
      const startX = (bbox?.x1 ?? 0) + 60;
      const cols = 6;
      unchanged.forEach((n: any, idx: number) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        n.position({
          x: startX + col * 180,
          y: startY + row * 120,
        });
      });
    }

    const visible = cy.elements().not(`.${cls.hidden}`);
    if (!initialFitDone.current) {
      cy.fit(visible, 30);
      initialFitDone.current = true;
    } else if (effectiveShowUnchanged && !prevShowUnchanged.current) {
      cy.fit(visible, 30);
    }
    prevShowUnchanged.current = effectiveShowUnchanged;
    setLayingOut(false);
  }, [elements, degreeMap, effectiveShowUnchanged]);

  // Handle external selection
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.elements().unselect();
    if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId);
      if (node && node.length) {
        node.select();
        cy.center(node);
      }
    }
  }, [selectedNodeId]);

  // Resize fit
  useEffect(() => {
    const handler = () => {
      if (cyRef.current) cyRef.current.fit(cyRef.current.elements(), 20);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm">
      {layingOut && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
          Laying out…
        </div>
      )}
      <div
        ref={containerRef}
        style={{ height }}
        className="rounded-3xl"
      />
    </div>
  );
}
