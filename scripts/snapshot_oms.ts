#!/usr/bin/env ts-node
/**
 * D085H snapshot helper: fetch live OMS graph data and persist a timestamped snapshot.
 */

import { fetchLiveGraphDataset, saveSnapshot } from "../src/lib/graph/snapshotPipeline";

const projectArg = process.env.OMS_SNAPSHOT_PROJECT ?? process.argv[2] ?? "700am";
const scenarioArg = process.env.OMS_SNAPSHOT_SCENARIO;

async function main() {
  console.log(`[snapshot] capturing OMS snapshot for project ${projectArg}…`);
  const dataset = await fetchLiveGraphDataset({ projectId: projectArg, mode: "all" });
  const saved = await saveSnapshot(dataset, { scenario: scenarioArg });
  console.log(`[snapshot] wrote ${saved.file}`);
  console.log(`  captured_at: ${saved.metadata.captured_at}`);
  console.log(`  nodes: ${saved.payload.nodes.length}`);
  console.log(`  edges: ${saved.payload.edges.length}`);
}

main().catch((err) => {
  console.error("[snapshot] failed to capture OMS snapshot", err);
  process.exit(1);
});
