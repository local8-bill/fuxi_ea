import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

type Source = "Lucid" | "Inventory" | "Future";

export type HarmonizedSystem = {
  id: string;
  label: string;
  system_name: string;
  domain: string | null;
  source_origin: Source[];
  state: "added" | "removed" | "modified" | "unchanged";
  confidence: number;
};

export type HarmonizedGraph = {
  nodes: HarmonizedSystem[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    state: "added" | "removed" | "modified" | "unchanged";
    confidence: number;
  }>;
};

const DATA_ROOT =
  process.env.FUXI_DATA_ROOT ??
  path.join(process.cwd(), ".fuxi", "data");
const INGESTED_DIR = path.join(DATA_ROOT, "ingested");
const HARMONIZED_DIR = path.join(DATA_ROOT, "harmonized");
const TELEMETRY_FILE = path.join(DATA_ROOT, "telemetry_events.ndjson");
const CONFLICT_LOG = path.join(DATA_ROOT, "logs", "harmonization_conflicts.log");
const CURRENT_CSV = path.join(INGESTED_DIR, "enterprise_current_state.csv");
const FUTURE_CSV = path.join(INGESTED_DIR, "enterprise_future_state.csv");
type HarmonizeMode = "all" | "current" | "future";

async function readJson<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function appendTelemetry(event: {
  event_type: string;
  data?: Record<string, unknown>;
}) {
  try {
    await fs.mkdir(path.dirname(TELEMETRY_FILE), { recursive: true });
    const payload = {
      session_id: "server",
      workspace_id: "digital_enterprise",
      event_type: event.event_type,
      timestamp: new Date().toISOString(),
      data: event.data,
    };
    await fs.appendFile(TELEMETRY_FILE, JSON.stringify(payload) + "\n", "utf8");
  } catch {
    // swallow telemetry errors
  }
}

async function appendConflict(message: string) {
  try {
    await fs.mkdir(path.dirname(CONFLICT_LOG), { recursive: true });
    await fs.appendFile(
      CONFLICT_LOG,
      `[${new Date().toISOString()}] ${message}\n`,
      "utf8",
    );
  } catch {
    // ignore logging failures
  }
}

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const JUNK_LABELS = new Set([
  "unknown",
  "rectangle",
  "page",
  "document",
  "new",
  "existing",
]);

function resolveField(row: Record<string, any>, keys: string[]): string {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

type RawRecord = {
  key: string;
  name: string;
  domain: string | null;
  source: Source;
  upstream: string[];
  downstream: string[];
  disposition?: string | null;
};

function parseCsvFile(filePath: string): Record<string, any>[] {
  try {
    const text = readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (!lines.length) return [];
    const header = lines[0].split(",").map((h) => h.trim());
    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const row: Record<string, any> = {};
      header.forEach((h, idx) => {
        row[h] = cols[idx] ?? "";
      });
      rows.push(row);
    }
    return rows;
  } catch (err) {
    console.warn("[HARMONIZE] Failed to parse CSV", filePath, err);
    return [];
  }
}

function normalizeRecord(row: Record<string, any>, source: Source) {
  const label = resolveField(row, ["label", "Raw_Label", "Logical_Name", "Name", "System"]);
  const systemName = resolveField(row, ["system_name", "System", "Logical_Name", "Raw_Label", "Name"]);
  const name = systemName || label;
  const domain = resolveField(row, ["domain", "Domain"]) || null;
  const upstreamRaw = resolveField(row, ["upstream", "Dependencies_Upstream"]);
  const downstreamRaw = resolveField(row, ["downstream", "Dependencies_Downstream"]);
  const disposition = resolveField(row, ["state", "Disposition_Interpretation"]) || null;
  const upstream = upstreamRaw
    ? upstreamRaw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
    : [];
  const downstream = downstreamRaw
    ? downstreamRaw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
    : [];

  return { name, domain, upstream, downstream, disposition, source };
}

function buildRawRecords(
  mode: HarmonizeMode,
): { records: RawRecord[]; headerMapping: Record<string, string[]>; hasFuture: boolean; hasCurrent: boolean } {
  const records: RawRecord[] = [];
  const headerMapping: Record<string, string[]> = {};
  let hasFuture = false;
  let hasCurrent = false;

  const datasets: Array<{ rows: any[]; source: Source }> = [];

  const lucidPath = path.join(INGESTED_DIR, "lucid_clean.json");
  const invPath = path.join(INGESTED_DIR, "inventory_normalized.json");
  const futurePath = path.join(INGESTED_DIR, "future_state.json");

  const lucid = requireCacheSafe(lucidPath) ?? [];
  const inventory = requireCacheSafe(invPath) ?? [];
  const futureJson = requireCacheSafe(futurePath) ?? [];

  const includeCurrent = mode === "all" || mode === "current";
  const includeFuture = mode === "all" || mode === "future";

  if (includeCurrent) {
    datasets.push({ rows: lucid, source: "Lucid" });
    datasets.push({ rows: inventory, source: "Inventory" });
    if ((lucid?.length ?? 0) > 0 || (inventory?.length ?? 0) > 0) hasCurrent = true;
  }
  if (includeFuture) {
    datasets.push({ rows: futureJson, source: "Future" });
    if ((futureJson?.length ?? 0) > 0) hasFuture = true;
  }

  // CSV datasets with flexible headers
  if (includeCurrent) {
    const currentCsvRows = parseCsvFile(CURRENT_CSV);
    if (currentCsvRows.length) datasets.push({ rows: currentCsvRows, source: "Inventory" });
    if (currentCsvRows.length) hasCurrent = true;
  }
  if (includeFuture) {
    const futureCsvRows = parseCsvFile(FUTURE_CSV);
    if (futureCsvRows.length) datasets.push({ rows: futureCsvRows, source: "Future" });
    if (futureCsvRows.length) hasFuture = true;
  }

  const expectedFields: Record<string, string[]> = {
    label: ["label", "Raw_Label", "Logical_Name", "Name", "System"],
    system_name: ["system_name", "System", "Logical_Name", "Raw_Label", "Name"],
    domain: ["domain", "Domain"],
    upstream: ["upstream", "Dependencies_Upstream"],
    downstream: ["downstream", "Dependencies_Downstream"],
    state: ["state", "Disposition_Interpretation"],
    state_color: ["state_color", "Disposition_Color"],
  };

  for (const { rows, source } of datasets) {
    if (rows.length) {
      const keys = Object.keys(rows[0] || {});
      const mapping: string[] = [];
      Object.entries(expectedFields).forEach(([field, candidates]) => {
        const found = candidates.find((c) => keys.includes(c));
        if (found) mapping.push(`${field}:${found}`);
      });
      headerMapping[source] = mapping;
    }
    for (const row of rows) {
      const normalized = normalizeRecord(row, source);
      const name = normalized.name;
      const key = normalizeKey(name);
      if (!name || !key || JUNK_LABELS.has(key)) continue;
      records.push({
        key,
        name,
        domain: normalized.domain,
        source,
        upstream: normalized.upstream.map((u) => normalizeKey(u)).filter(Boolean),
        downstream: normalized.downstream.map((d) => normalizeKey(d)).filter(Boolean),
        disposition: normalized.disposition,
      });
    }
  }
  return { records, headerMapping, hasFuture, hasCurrent };
}

function requireCacheSafe(file: string): any[] | null {
  try {
    const raw = readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function jaccard(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const inter = Array.from(setA).filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  return inter / union;
}

function buildResolver(keys: string[]) {
  const keySet = new Set(keys);
  return (candidate: string): string | null => {
    const norm = normalizeKey(candidate);
    if (keySet.has(norm)) return norm;
    let best: { key: string; score: number } | null = null;
    for (const k of keys) {
      const score = jaccard(norm, k);
      if (!best || score > best.score) {
        best = { key: k, score };
      }
    }
    if (best && best.score >= 0.5) return best.key;
    return null;
  };
}
}

function stateFromPresence(
  inLucid: boolean,
  inInventory: boolean,
  inFuture: boolean,
  changed: boolean,
  hasFuture: boolean,
): HarmonizedSystem["state"] {
  if (!hasFuture) {
    // Single-source scenario: keep as unchanged rather than removed.
    return "unchanged";
  }
  if (inFuture && !inLucid && !inInventory) return "added";
  if (!inFuture && (inLucid || inInventory)) return "removed";
  if (changed) return "modified";
  return "unchanged";
}

export async function harmonizeSystems(opts?: { mode?: HarmonizeMode }): Promise<HarmonizedGraph> {
  const mode: HarmonizeMode = opts?.mode ?? "all";
  const { records, headerMapping, hasFuture, hasCurrent } = buildRawRecords(mode);
  await appendTelemetry({ event_type: "harmonization_start", data: { header_mapping: headerMapping, mode } });
  const expectedCount = 5; // label/system/domain/upstream/downstream
  Object.entries(headerMapping).forEach(([source, mappings]) => {
    const coverage = mappings.length / expectedCount;
    if (coverage < 0.7) {
      console.warn("[HARMONIZE] Sparse header coverage", { source, coverage, mappings });
    }
  });

  const byKey = new Map<
    string,
    {
      key: string;
      name: string;
      domain: string | null;
      sources: Source[];
      changed: boolean;
    }
  >();

  const edgeRequests: Array<{ from: string; to: string; source: Source }> = [];

  for (const rec of records) {
    const existing = byKey.get(rec.key);
    if (!existing) {
      byKey.set(rec.key, {
        key: rec.key,
        name: rec.name,
        domain: rec.domain,
        sources: [rec.source],
        changed: false,
      });
    } else {
      if (!existing.sources.includes(rec.source)) existing.sources.push(rec.source);
      if (existing.domain !== rec.domain && rec.domain) {
        existing.changed = true;
        existing.domain = existing.domain ?? rec.domain;
      }
    }
    rec.upstream.forEach((u) => edgeRequests.push({ from: u, to: rec.key, source: rec.source }));
    rec.downstream.forEach((d) => edgeRequests.push({ from: rec.key, to: d, source: rec.source }));
  }

  const nodes: HarmonizedSystem[] = [];
  for (const entry of byKey.values()) {
    const inLucid = entry.sources.includes("Lucid");
    const inInventory = entry.sources.includes("Inventory");
    const inFuture = entry.sources.includes("Future");
    const state = stateFromPresence(inLucid, inInventory, inFuture, entry.changed, hasFuture);
    const confidence =
      0.5 +
      (inFuture ? 0.2 : 0) +
      (inInventory ? 0.15 : 0) +
      (inLucid ? 0.1 : 0) -
      (entry.changed ? 0.05 : 0);

    nodes.push({
      id: entry.key,
      label: entry.name,
      system_name: entry.name,
      domain: entry.domain,
      source_origin: entry.sources,
      state,
      confidence: Math.max(0, Math.min(1, Number(confidence.toFixed(2)))),
    });
  }

  const nodeKeys = new Set(nodes.map((n) => n.id));
  const edgeSet = new Set<string>();
  const edges: HarmonizedGraph["edges"] = [];
  const resolver = buildResolver(Array.from(nodeKeys));
  for (const req of edgeRequests) {
    const from = resolver(req.from);
    const to = resolver(req.to);
    if (!from || !to) continue;
    const edgeId = `${from}->${to}`;
    if (edgeSet.has(edgeId)) continue;
    edgeSet.add(edgeId);
    edges.push({
      id: edgeId,
      source: from,
      target: to,
      state: "unchanged",
      confidence: 0.6,
    });
  }

  const totalNodes = nodes.length;
  const totalEdges = edges.length;
  const avgConfidence =
    nodes.reduce((sum, n) => sum + (n.confidence ?? 0), 0) /
    Math.max(1, nodes.length);

  await fs.mkdir(HARMONIZED_DIR, { recursive: true });
  const graphOut = path.join(HARMONIZED_DIR, "enterprise_graph.json");
  await fs.writeFile(
    graphOut,
    JSON.stringify({ nodes, edges }, null, 2),
    "utf8",
  );

  await appendTelemetry({
    event_type: "harmonization_complete",
    data: { total_nodes: totalNodes, total_edges: totalEdges, avg_confidence: avgConfidence },
  });

  // Filtered views
  if (mode === "current") {
    const keep = new Set(nodes.filter((n) => n.state === "removed").map((n) => n.id));
    return {
      nodes: nodes.filter((n) => keep.has(n.id)),
      edges: edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
    };
  }
  if (mode === "future") {
    const keep = new Set(nodes.filter((n) => n.state === "added").map((n) => n.id));
    return {
      nodes: nodes.filter((n) => keep.has(n.id)),
      edges: edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
    };
  }
  // delta = added/removed/modified; if no future present, return all nodes instead of empty.
  const deltaNodes = nodes.filter((n) => n.state === "added" || n.state === "removed" || n.state === "modified");
  const keep = new Set(deltaNodes.length > 0 ? deltaNodes.map((n) => n.id) : nodes.map((n) => n.id));
  return {
    nodes: nodes.filter((n) => keep.has(n.id)),
    edges: edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
  };
}
