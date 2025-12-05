import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type HarmonizedGraph = {
  nodes?: Array<{ id: string; domain?: string; platform?: string }>;
  edges?: Array<{ id: string; source: string; target: string }>;
};

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const GRAPH_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

async function loadGraph(): Promise<HarmonizedGraph> {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf8");
    return JSON.parse(raw) as HarmonizedGraph;
  } catch {
    return { nodes: [], edges: [] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, platforms = [] } = await req.json();

    const graph = await loadGraph();
    let nodes = graph.nodes ?? [];
    const edges = graph.edges ?? [];

    if (Array.isArray(platforms) && platforms.length) {
      nodes = nodes.filter((n) => !n.platform || platforms.includes(n.platform));
    }

    const domains = new Set(nodes.map((n) => n.domain).filter(Boolean) as string[]);
    const summary = {
      systems: nodes.length,
      integrations: edges.length,
      domains: domains.size,
    };

    const transitionUrl = projectId ? `/project/${projectId}/digital-enterprise` : "/project/demo/digital-enterprise";

    return NextResponse.json({
      status: "ok",
      summary,
      transitionUrl,
    });
  } catch (err: any) {
    console.error("[/api/harmonization] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
