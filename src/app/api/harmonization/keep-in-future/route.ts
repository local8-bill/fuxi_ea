import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const GRAPH_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { nodeId?: string; label?: string; domain?: string } | null;
    if (!body) return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });

    const graphRaw = await fs.readFile(GRAPH_FILE, "utf8").catch(() => null);
    if (!graphRaw) return NextResponse.json({ ok: false, error: "Graph not found" }, { status: 404 });
    const graph = JSON.parse(graphRaw) as {
      nodes: Array<{ id: string; label: string; domain?: string | null; source_origin?: string[]; state?: string }>;
      edges: any[];
    };

    const findNode = () => {
      const byId = graph.nodes.find((n) => n.id === body.nodeId);
      if (byId) return byId;
      if (body.label) {
        const lowered = body.label.toLowerCase();
        return graph.nodes.find((n) => n.label?.toLowerCase() === lowered);
      }
      return null;
    };

    const node = findNode();
    if (!node) {
      return NextResponse.json({ ok: false, error: "Node not found" }, { status: 404 });
    }

    // Ensure domain set if provided
    if (body.domain) {
      node.domain = body.domain;
    }

    // Add Future to sources
    const sources = new Set(node.source_origin ?? []);
    sources.add("Future");
    node.source_origin = Array.from(sources);

    // If it was marked removed, normalize to unchanged
    if (node.state === "removed") {
      node.state = "unchanged";
    }

    await fs.mkdir(path.dirname(GRAPH_FILE), { recursive: true });
    await fs.writeFile(GRAPH_FILE, JSON.stringify(graph, null, 2), "utf8");

    return NextResponse.json({ ok: true, node });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Failed to update" }, { status: 500 });
  }
}
