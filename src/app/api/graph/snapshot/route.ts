import { NextRequest, NextResponse } from "next/server";
import { fetchLiveGraphDataset, loadLatestSnapshot, saveSnapshot } from "@/lib/graph/snapshotPipeline";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "snapshot").toLowerCase();
  const projectId = url.searchParams.get("project") ?? "700am";

  if (mode === "live") {
    const dataset = await fetchLiveGraphDataset({ projectId, mode: "all" });
    const metadata = {
      source: "live",
      project: dataset.projectId,
      captured_at: new Date().toISOString(),
      mode: dataset.mode,
    };
    return NextResponse.json(
      {
        ok: true,
        source: "live",
        metadata,
        nodes: dataset.nodes,
        edges: dataset.edges,
      },
      { status: 200 },
    );
  }

  const latest = await loadLatestSnapshot();
  if (!latest) {
    return NextResponse.json({ ok: false, message: "No snapshot available." }, { status: 404 });
  }
  return NextResponse.json(
    {
      ok: true,
      source: "snapshot",
      metadata: latest.metadata,
      nodes: latest.nodes,
      edges: latest.edges,
      file: latest.file,
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = typeof body.project === "string" && body.project.trim().length ? body.project.trim() : "700am";
    const scenario = typeof body.scenario === "string" ? body.scenario : undefined;
    const dataset = await fetchLiveGraphDataset({ projectId, mode: "all" });
    const saved = await saveSnapshot(dataset, { scenario });
    return NextResponse.json(
      {
        ok: true,
        metadata: saved.metadata,
        file: saved.file,
        nodes: saved.payload.nodes.length,
        edges: saved.payload.edges.length,
      },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("[snapshot] POST error", err);
    return NextResponse.json({ ok: false, message: "Failed to capture snapshot." }, { status: 500 });
  }
}
