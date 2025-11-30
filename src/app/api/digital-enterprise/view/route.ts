"use server";

import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";
import { getDigitalEnterpriseView } from "@/domain/services/digitalEnterpriseStore";
import { harmonizeSystems } from "@/domain/services/harmonization";

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
      return NextResponse.json(
        {
          ok: true,
          projectId,
          nodes: graph.nodes,
          edges: graph.edges,
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
