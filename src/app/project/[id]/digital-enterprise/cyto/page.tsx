import type { ReactElement } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import { CytoGraph } from "@/archive/graph_engines/CytoGraph";
import type { HarmonizedGraph } from "@/domain/services/harmonization";

// Next 16: params is a Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const GRAPH_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

async function readGraph(): Promise<HarmonizedGraph | null> {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf8");
    return JSON.parse(raw) as HarmonizedGraph;
  } catch {
    return null;
  }
}

export default async function CytoPreviewPage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "";
  const graph = await readGraph();

  if (!graph || !graph.nodes?.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Digital Enterprise — Cytoscape Preview</h1>
        <p className="mt-3 text-slate-600">
          No harmonized data found. Upload current/future inventory and run harmonization first.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cytoscape Preview</p>
        <h1 className="text-2xl font-bold text-slate-900">Digital Enterprise (Cyto)</h1>
        <p className="mt-2 text-slate-600">Early D041 preview: domain compounds, edge palette, and layout toggles.</p>
      </header>
      <CytoGraph graph={graph} height={800} />
    </div>
  );
}
