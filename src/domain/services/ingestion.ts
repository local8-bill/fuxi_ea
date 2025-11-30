// src/domain/services/ingestion.ts
import { read, utils } from "xlsx";
import fs from "node:fs/promises";
import path from "node:path";
import { parseLucidCsv } from "@/domain/services/lucidIngestion";
import type { InventoryRow } from "@/domain/model/modernization";

/**
 * Best-effort CSV parser — used for .csv/.txt or XLSX fallback.
 */
function parseCsvText(text: string): InventoryRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) return [];

  const rawHeader = lines[0].split(",");
  const header = rawHeader.map((col) => col.trim());

  const resolveField = (cols: string[], candidates: string[]): string => {
    for (const cand of candidates) {
      const idx = header.findIndex((h) => h.toLowerCase() === cand.toLowerCase());
      if (idx !== -1) {
        return cols[idx]?.trim() ?? "";
      }
    }
    return "";
  };

  const rows: InventoryRow[] = lines.slice(1).map((line, idx) => {
    const cols = line.split(",");

    const systemName = resolveField(cols, [
      ...ALT_APP_HEADERS,
    ]);

    const vendor = resolveField(cols, ALT_VENDOR_HEADERS);
    const domainHint = resolveField(cols, ALT_DOMAIN_HEADERS);
    const dispositionRaw = resolveField(cols, ALT_DISPOSITION_HEADERS);

    return {
      systemName,
      vendor: vendor || undefined,
      domainHint: domainHint || undefined,
      dispositionRaw: dispositionRaw || undefined,
      sourceRow: idx + 2,
    };
  });

  const filtered = rows.filter((r) => r.systemName);
  console.log("[Inventory ingest][CSV] parsed rows:", filtered.length);
  return filtered;
}

const ALT_APP_HEADERS = [
  "application",
  "system",
  "application name",
  "app name",
  "name",
  "logical_name",
  "raw_label",
  "label",
];

const ALT_DOMAIN_HEADERS = ["domain", "business domain", "capability", "capability_area"];
const ALT_DISPOSITION_HEADERS = ["disposition", "status", "lifecycle", "state", "disposition_interpretation"];
const ALT_VENDOR_HEADERS = ["vendor", "supplier"];

function getField(row: Record<string, any>, candidates: string[]): string {
  const entries = Object.entries(row);
  for (const candidate of candidates) {
    const cand = candidate.toLowerCase();
    for (const [key, value] of entries) {
      const k = key.toString().trim().toLowerCase();
      if (k === cand || k.includes(cand)) {
        if (value == null) return "";
        return value.toString().trim();
      }
    }
  }
  return "";
}

/**
 * Super-forgiving XLSX/CSV parser for inventory files.
 * Tries hard to find an "application/system" column; if it can't, uses the first non-empty column.
 */
export function parseInventoryExcel(
  buffer: Buffer,
  filename?: string,
): InventoryRow[] {
  const name = filename?.toLowerCase() ?? "";

  // Obvious CSV cases
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsvText(buffer.toString("utf8"));
  }

  try {
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || !name) {
      const workbook = read(buffer, { type: "buffer" });

      const inventorySheetName = workbook.Sheets["Inventory"]
        ? "Inventory"
        : workbook.SheetNames[0];

      if (!inventorySheetName) {
        console.log("[Inventory ingest][XLSX] no sheet found");
        return [];
      }

      const sheet = workbook.Sheets[inventorySheetName];
      const json = utils.sheet_to_json<Record<string, any>>(sheet, {
        defval: "",
        blankrows: false,
      });

      console.log(
        "[Inventory ingest][XLSX] filename=%s raw rows=%d",
        filename,
        json.length,
      );
      if (json[0]) {
        console.log(
          "[Inventory ingest][XLSX] first row keys=",
          Object.keys(json[0]),
        );
      }

      const rows: InventoryRow[] = json
        .map((row, idx) => {
          let systemName = getField(row, ALT_APP_HEADERS);

          if (!systemName) {
            // Fallback: first non-empty value in the row
            const firstNonEmpty = Object.values(row)
              .map((v) => (v == null ? "" : v.toString().trim()))
              .find((v) => v.length > 0);
            systemName = firstNonEmpty || "";
          }

          if (!systemName) {
            return null;
          }

          const vendor = getField(row, ALT_VENDOR_HEADERS);
          const domainHint = getField(row, ALT_DOMAIN_HEADERS);
          const dispositionRaw = getField(row, ALT_DISPOSITION_HEADERS);

          const result: InventoryRow = {
            systemName,
            vendor: vendor || undefined,
            domainHint: domainHint || undefined,
            dispositionRaw: dispositionRaw || undefined,
            sourceRow: idx + 2,
          };

          return result;
        })
        .filter((r): r is InventoryRow => !!r && !!r.systemName);

      console.log("[Inventory ingest][XLSX] parsed inventory rows:", rows.length);
      return rows;
    }
  } catch (err) {
    console.error("[Inventory ingest][XLSX] parse failed, fallback to CSV:", err);
  }

  // Last resort: treat as CSV-ish text
  return parseCsvText(buffer.toString("utf8"));
}

// ----------------- Lucid Normalizer (D027) -----------------

export type NormalizedSystemRecord = {
  system_name: string;
  domain: string | null;
  integration_type: string | null;
  source: "Lucid";
  disposition: string | null;
  confidence: number;
};

type TelemetryShape = {
  event_type: string;
  workspace_id: string;
  data?: Record<string, unknown>;
  simplification_score?: number;
};

const INGEST_DIR =
  process.env.FUXI_DATA_ROOT ??
  path.join(process.cwd(), ".fuxi", "data");
const LUCID_OUT = path.join(INGEST_DIR, "ingested", "lucid_clean.json");
const TELEMETRY_FILE = path.join(INGEST_DIR, "telemetry_events.ndjson");

async function appendTelemetry(event: TelemetryShape) {
  try {
    await fs.mkdir(path.dirname(TELEMETRY_FILE), { recursive: true });
    const payload = {
      session_id: "server",
      project_id: undefined,
      workspace_id: event.workspace_id,
      event_type: event.event_type,
      timestamp: new Date().toISOString(),
      data: event.data,
      simplification_score: event.simplification_score,
    };
    await fs.appendFile(TELEMETRY_FILE, JSON.stringify(payload) + "\n", "utf8");
  } catch (err) {
    console.warn("[Lucid normalize][telemetry] failed", err);
  }
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = Array.from(setA).filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size || 1;
  return intersection / union;
}

function inferDomain(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("commerce") || l.includes("order") || l.includes("cart")) return "Commerce";
  if (l.includes("erp") || l.includes("sap") || l.includes("oracle")) return "ERP";
  if (l.includes("crm") || l.includes("salesforce")) return "CRM";
  if (l.includes("hr") || l.includes("workday") || l.includes("payroll")) return "HR";
  if (l.includes("data") || l.includes("warehouse") || l.includes("lake")) return "Data";
  if (l.includes("integration") || l.includes("api") || l.includes("connector")) return "Integration";
  return null;
}

function inferIntegrationType(label: string): string | null {
  const l = label.toLowerCase();
  if (l.includes("api")) return "API";
  if (l.includes("connector") || l.includes("middleware") || l.includes("mulesoft") || l.includes("boomi")) {
    return "Integration";
  }
  if (l.includes("batch") || l.includes("etl")) return "Batch";
  return null;
}

export async function normalizeLucidData(rawCsv: string): Promise<NormalizedSystemRecord[]> {
  await appendTelemetry({
    workspace_id: "digital_enterprise",
    event_type: "lucid_parse_start",
    data: { file_name: "upload", record_count: rawCsv?.length ?? 0 },
  });

  const parsed = parseLucidCsv(rawCsv);
  const nodes = parsed?.nodes ?? [];
  const edges = parsed?.edges ?? [];

  // Build basic counts
  const degree = new Map<string, number>();
  edges.forEach((e) => {
    if (e.sourceId) degree.set(e.sourceId, (degree.get(e.sourceId) ?? 0) + 1);
    if (e.targetId) degree.set(e.targetId, (degree.get(e.targetId) ?? 0) + 1);
  });

  // Deduplicate nodes by name similarity
  const threshold = 0.85;
  const canonicals: { label: string; norm: string; members: string[] }[] = [];

  for (const n of nodes) {
    const label = n.label?.trim();
    if (!label) continue;
    const norm = normalizeName(label);
    const found = canonicals.find((c) => similarity(c.norm, norm) >= threshold);
    if (found) {
      found.members.push(label);
    } else {
      canonicals.push({ label, norm, members: [label] });
    }
  }

  const normalized: NormalizedSystemRecord[] = canonicals.map((c) => {
    const domain = inferDomain(c.label);
    const integration = inferIntegrationType(c.label);
    const confBase = 0.6;
    const confidence = Math.min(
      1,
      confBase + (domain ? 0.15 : 0) + (integration ? 0.15 : 0) + (c.members.length > 1 ? 0.05 : 0),
    );
    return {
      system_name: c.label,
      domain,
      integration_type: integration,
      source: "Lucid",
      disposition: null,
      confidence: Number(confidence.toFixed(2)),
    };
  });

  await appendTelemetry({
    workspace_id: "digital_enterprise",
    event_type: "lucid_filtered",
    data: { filtered_count: nodes.length - canonicals.length, retained_count: canonicals.length },
  });

  await fs.mkdir(path.dirname(LUCID_OUT), { recursive: true });
  await fs.writeFile(LUCID_OUT, JSON.stringify(normalized, null, 2), "utf8");

  await appendTelemetry({
    workspace_id: "digital_enterprise",
    event_type: "lucid_complete",
    data: {
      total_in: nodes.length,
      total_out: normalized.length,
      avg_confidence: normalized.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / Math.max(1, normalized.length),
    },
  });

  return normalized;
}
