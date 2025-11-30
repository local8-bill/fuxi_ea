"use server";

import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";
import { getDigitalEnterpriseView } from "@/domain/services/digitalEnterpriseStore";
import { harmonizeSystems } from "@/domain/services/harmonization";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const CONFIRMED_CONNECTIONS = path.join(DATA_ROOT, "connections", "derived_edges.json");

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project") ?? "";
    const modeParam = url.searchParams.get("mode") ?? "all";
    const mode = modeParam === "current" || modeParam === "future" ? modeParam : "all";
    if (!projectId) {
      return jsonError(400, "Missing project param");
    }

    // Harmonization produces unified graph; fallback to stored Lucid view if harmonization fails.
    try {
      const graph = await harmonizeSystems({ mode });
      const merged = await mergeConfirmedEdges(graph);
      return NextResponse.json(
        {
          ok: true,
          projectId,
          nodes: merged.nodes,
          edges: merged.edges,
        },
        { status: 200 },
      );
    } catch (err: any) {
      console.warn("[DE-VIEW] Harmonization failed, falling back to stored view", err);
    }

    const view = await getDigitalEnterpriseView(projectId);
    if (!view) {
      return NextResponse.json(
        { ok: true, projectId, nodes: [], edges: [] },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        projectId,
        nodes: view.nodes ?? [],
        edges: view.edges ?? [],
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[DE-VIEW] GET error", err);
    return jsonError(500, "Failed to load digital enterprise view", err?.message);
  }
}

async function mergeConfirmedEdges(graph: Awaited<ReturnType<typeof harmonizeSystems>>) {
  try {
    const raw = await fs.readFile(CONFIRMED_CONNECTIONS, "utf8");
    const parsed = JSON.parse(raw);
    const edges = parsed?.edges ?? [];
    if (!Array.isArray(edges) || edges.length === 0) return graph;
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const mergedEdges = [...graph.edges];
    for (const e of edges) {
      if (!e?.source || !e?.target) continue;
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
      const id = e.id ?? `${e.source}->${e.target}`;
      if (mergedEdges.find((ex) => ex.id === id)) continue;
      mergedEdges.push({
        id,
        source: e.source,
        target: e.target,
        state: "confirmed",
        confidence: e.confidence ?? 0.7,
      });
    }
    return { ...graph, edges: mergedEdges };
  } catch {
    return graph;
  }
}
