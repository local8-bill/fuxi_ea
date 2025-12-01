import fs from "node:fs/promises";
import path from "node:path";
import { recordTelemetry } from "@/lib/telemetry/server";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const INGESTED_DIR = path.join(DATA_ROOT, "ingested");
const HARMONIZED_DIR = path.join(DATA_ROOT, "harmonized");
const OUTPUT_FILE = path.join(HARMONIZED_DIR, "transformation_sequence.json");

const DEMO_DIR = path.join(process.cwd(), "public", "demo_data");

type RawRow = {
  system: string;
  domain: string;
  type?: string;
  upstream?: string;
  downstream?: string;
  owner?: string;
  disposition?: string;
  confidence?: number;
};

export type SequencedSystem = {
  system: string;
  domain: string;
  state: "Retain" | "Modify" | "Retire" | "Add";
  confidence: number;
  dependencies: string[];
  sequence_stage: number;
};

export type SequencerResult = {
  nodes: SequencedSystem[];
  edges: Array<{ from: string; to: string }>;
  stages: number;
  summary: {
    total: number;
    add: number;
    retire: number;
    modify: number;
    retain: number;
  };
};

function parseCsv(text: string): RawRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const row: any = {};
    header.forEach((h, idx) => (row[h] = cols[idx] ?? ""));
    return {
      system: row.System || row.system || row.Name || row.name || "",
      domain: row.Domain || row.domain || "",
      type: row.Type || row.type || "",
      upstream: row.Upstream || row.upstream || "",
      downstream: row.Downstream || row.downstream || "",
      owner: row.Owner || row.owner || "",
      disposition: row.Disposition || row.disposition || "",
      confidence: row.Confidence ? Number(row.Confidence) : undefined,
    };
  });
}

async function readCsvFallback(names: string[]): Promise<RawRow[]> {
  for (const name of names) {
    const ingested = path.join(INGESTED_DIR, name);
    const demo = path.join(DEMO_DIR, name);
    try {
      const text = await fs.readFile(ingested, "utf8");
      return parseCsv(text);
    } catch {
      // fall through
    }
    try {
      const text = await fs.readFile(demo, "utf8");
      return parseCsv(text);
    } catch {
      // ignore
    }
  }
  return [];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function buildMap(rows: RawRow[]) {
  const map = new Map<string, RawRow>();
  rows.forEach((r) => {
    const key = normalizeName(r.system || "");
    if (!key) return;
    map.set(key, r);
  });
  return map;
}

function determineState(current?: RawRow, future?: RawRow): SequencedSystem["state"] {
  if (current && !future) return "Retire";
  if (!current && future) return "Add";
  if (current && future) {
    const sameDomain = normalizeName(current.domain) === normalizeName(future.domain);
    const sameDisp = (current.disposition || "").toLowerCase() === (future.disposition || "").toLowerCase();
    if (sameDomain && sameDisp) return "Retain";
    return "Modify";
  }
  return "Retain";
}

function parseDeps(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function topoSort(nodes: SequencedSystem[], edges: Array<{ from: string; to: string }>): Map<string, number> {
  const incoming = new Map<string, Set<string>>();
  nodes.forEach((n) => incoming.set(n.system, new Set()));
  edges.forEach((e) => {
    if (!incoming.has(e.to)) incoming.set(e.to, new Set());
    incoming.get(e.to)!.add(e.from);
  });

  const stage = new Map<string, number>();
  const ready: string[] = [];
  incoming.forEach((deps, node) => {
    if (deps.size === 0) ready.push(node);
  });

  let currentStage = 1;
  let visited = 0;
  while (ready.length) {
    const batch = [...ready];
    ready.length = 0;
    batch.forEach((node) => {
      stage.set(node, currentStage);
      visited += 1;
      // remove node from others
      edges
        .filter((e) => e.from === node)
        .forEach((e) => {
          const deps = incoming.get(e.to);
          if (deps) {
            deps.delete(node);
            if (deps.size === 0) ready.push(e.to);
          }
        });
    });
    currentStage += 1;
  }

  // Any remaining (cycles) put at last stage
  nodes.forEach((n) => {
    if (!stage.has(n.system)) {
      stage.set(n.system, currentStage);
    }
  });

  return stage;
}

export async function generateTransformationSequence(): Promise<SequencerResult> {
  const currentRows = await readCsvFallback(["enterprise_current_state.csv", "inventory_current.csv"]);
  const futureRows = await readCsvFallback(["enterprise_future_state.csv", "inventory_future.csv"]);

  const currentMap = buildMap(currentRows);
  const futureMap = buildMap(futureRows);
  const allKeys = new Set<string>([...currentMap.keys(), ...futureMap.keys()]);

  const nodes: SequencedSystem[] = [];
  const edges: Array<{ from: string; to: string }> = [];

  allKeys.forEach((key) => {
    const current = currentMap.get(key);
    const future = futureMap.get(key);
    const name = future?.system || current?.system || key;
    const state = determineState(current, future);
    const domain = future?.domain || current?.domain || "Other";
    const confidence = future?.confidence ?? current?.confidence ?? 0.6;
    const deps = new Set<string>();
    parseDeps(current?.upstream).forEach((d) => deps.add(d));
    parseDeps(current?.downstream).forEach((d) => deps.add(d));
    parseDeps(future?.upstream).forEach((d) => deps.add(d));
    parseDeps(future?.downstream).forEach((d) => deps.add(d));
    nodes.push({
      system: name,
      domain,
      state,
      confidence: Math.max(0, Math.min(1, confidence)),
      dependencies: Array.from(deps),
      sequence_stage: 0, // placeholder
    });
  });

  // Build edges based on dependencies (normalized)
  const nameToNorm = new Map(nodes.map((n) => [normalizeName(n.system), n.system]));
  nodes.forEach((n) => {
    n.dependencies.forEach((dep) => {
      const target = n.system;
      const fromKey = normalizeName(dep);
      const from = nameToNorm.get(fromKey);
      if (from) {
        edges.push({ from, to: target });
      }
    });
  });

  const stageMap = topoSort(nodes, edges);
  let maxStage = 1;
  nodes.forEach((n) => {
    const s = stageMap.get(n.system) ?? 1;
    n.sequence_stage = s;
    if (s > maxStage) maxStage = s;
  });

  await fs.mkdir(HARMONIZED_DIR, { recursive: true });
  const summary = {
    total: nodes.length,
    add: nodes.filter((n) => n.state === "Add").length,
    retire: nodes.filter((n) => n.state === "Retire").length,
    modify: nodes.filter((n) => n.state === "Modify").length,
    retain: nodes.filter((n) => n.state === "Retain").length,
  };
  const result: SequencerResult = { nodes, edges, stages: maxStage, summary };
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), "utf8");

  await recordTelemetry({
    workspace_id: "transformation_dialogue",
    event_type: "sequencer_generate",
    data: { summary },
  });

  return result;
}

export async function readTransformationSequence(): Promise<SequencerResult | null> {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, "utf8");
    return JSON.parse(raw) as SequencerResult;
  } catch {
    return null;
  }
}
