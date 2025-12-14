"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { harmonizeSystems } from "../../domain/services/harmonization";
import { getDigitalEnterpriseView } from "../../domain/services/digitalEnterpriseStore";

type GraphMode = "all" | "current" | "future";

const SNAPSHOT_DIR = path.join(process.cwd(), "src", "data", "graph", "snapshots");
const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const CONFIRMED_CONNECTIONS = path.join(DATA_ROOT, "connections", "derived_edges.json");

export type SnapshotMetadata = {
  source: string;
  project: string;
  scenario?: string;
  captured_at: string;
  mode: GraphMode;
};

export type SnapshotPayload = SnapshotMetadata & {
  nodes: any[];
  edges: any[];
};

async function ensureSnapshotDir() {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  return SNAPSHOT_DIR;
}

async function mergeConfirmedEdges(graph: Awaited<ReturnType<typeof harmonizeSystems>>) {
  try {
    const raw = await fs.readFile(CONFIRMED_CONNECTIONS, "utf8");
    const parsed = JSON.parse(raw);
    const edges = Array.isArray(parsed?.edges) ? parsed.edges : [];
    if (!edges.length) return graph;
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const mergedEdges = [...graph.edges];
    for (const edge of edges) {
      if (!edge?.source || !edge?.target) continue;
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
      const id = edge.id ?? `${edge.source}->${edge.target}`;
      if (mergedEdges.find((existing) => existing.id === id)) continue;
      mergedEdges.push({
        id,
        source: edge.source,
        target: edge.target,
        state: edge.state ?? "unchanged",
        confidence: edge.confidence ?? 0.7,
      });
    }
    return { ...graph, edges: mergedEdges };
  } catch {
    return graph;
  }
}

export async function fetchLiveGraphDataset(options: { projectId: string; mode?: GraphMode }) {
  const mode = options.mode ?? "all";
  try {
    const graph = await harmonizeSystems({ mode });
    const merged = await mergeConfirmedEdges(graph);
    return {
      projectId: options.projectId,
      nodes: merged.nodes,
      edges: merged.edges,
      mode,
    };
  } catch (err) {
    console.warn("[snapshot] harmonization failed, falling back to stored view", err);
  }
  const view = await getDigitalEnterpriseView(options.projectId);
  return {
    projectId: options.projectId,
    nodes: view?.nodes ?? [],
    edges: view?.edges ?? [],
    mode,
  };
}

function sanitizeScenario(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export async function saveSnapshot(dataset: { nodes: any[]; edges: any[]; projectId: string; mode: GraphMode }, options?: { scenario?: string }) {
  const dir = await ensureSnapshotDir();
  const timestamp = new Date().toISOString().replace(/[-:TZ]/g, "").slice(0, 14);
  const metadata: SnapshotMetadata = {
    source: "digital-enterprise-api + transcript-analysis",
    project: dataset.projectId,
    scenario: sanitizeScenario(options?.scenario) ?? "baseline",
    captured_at: new Date().toISOString(),
    mode: dataset.mode,
  };
  const payload: SnapshotPayload = {
    ...metadata,
    nodes: dataset.nodes,
    edges: dataset.edges,
  };
  const filename = `oms_${timestamp}.json`;
  await fs.writeFile(path.join(dir, filename), JSON.stringify(payload, null, 2), "utf8");
  await fs.writeFile(path.join(dir, "latest.json"), JSON.stringify(payload, null, 2), "utf8");
  return { file: filename, metadata, payload };
}

async function loadSnapshotFile(file: string) {
  try {
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw);
    const metadata: SnapshotMetadata = {
      source: typeof json.source === "string" ? json.source : "digital-enterprise-api + transcript-analysis",
      project: json.project ?? "unknown",
      scenario: sanitizeScenario(json.scenario),
      captured_at: json.captured_at ?? new Date().toISOString(),
      mode: (json.mode ?? "all") as GraphMode,
    };
    return {
      metadata,
      nodes: Array.isArray(json.nodes) ? json.nodes : [],
      edges: Array.isArray(json.edges) ? json.edges : [],
    };
  } catch (err) {
    console.warn("[snapshot] failed to read snapshot file", file, err);
    return null;
  }
}

export async function loadLatestSnapshot() {
  const dir = await ensureSnapshotDir();
  const entries = await fs.readdir(dir).catch(() => []);
  const snapshotFiles = entries.filter((file) => /^oms_\d+\.json$/i.test(file)).sort();
  let targetFile: string | null = snapshotFiles[snapshotFiles.length - 1]
    ? path.join(dir, snapshotFiles[snapshotFiles.length - 1])
    : null;
  if (!targetFile) {
    const latestPath = path.join(dir, "latest.json");
    try {
      await fs.access(latestPath);
      targetFile = latestPath;
    } catch {
      return null;
    }
  }
  const payload = await loadSnapshotFile(targetFile);
  if (!payload) return null;
  return {
    file: path.basename(targetFile),
    ...payload,
  };
}
