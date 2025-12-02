import fs from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import type { HarmonizedGraph } from "@/domain/services/harmonization";
import { inferConnections, type ConnectionSuggestion } from "@/domain/services/connectionInference";
import ConnectionConfirmationClient from "./ConnectionConfirmationClient";

// Next 16: params is a Promise and must be awaited.
interface PageProps {
  params: Promise<{ id: string }>;
}

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const HARMONIZED_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

async function readHarmonizedGraph(): Promise<HarmonizedGraph | null> {
  try {
    const raw = await fs.readFile(HARMONIZED_FILE, "utf8");
    return JSON.parse(raw) as HarmonizedGraph;
  } catch {
    return null;
  }
}

export default async function ConnectionConfirmationPage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "";

  const graph = await readHarmonizedGraph();
  if (!graph || !graph.nodes?.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Connection Confirmation</h1>
        <p className="mt-3 text-slate-600">
          No harmonized data is available. Upload artifacts and run harmonization first.
        </p>
      </div>
    );
  }

  const suggestions: ConnectionSuggestion[] = inferConnections(graph, 0.6);

  return <ConnectionConfirmationClient projectId={projectId} suggestions={suggestions} nodes={graph.nodes} />;
}
