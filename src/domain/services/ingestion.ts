// src/domain/services/ingestion.ts
import { read, utils } from "xlsx";
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

  const header = lines[0]
    .split(",")
    .map((col) => col.trim().toLowerCase());

  const colIndex = (name: string) => header.indexOf(name.toLowerCase());

  const get = (cols: string[], names: string[]) => {
    for (const name of names) {
      const idx = colIndex(name);
      if (idx !== -1) {
        return cols[idx]?.trim() ?? "";
      }
    }
    return "";
  };

  const rows: InventoryRow[] = lines.slice(1).map((line, idx) => {
    const cols = line.split(",");

    const systemName = get(cols, [
      "application",
      "system",
      "application name",
      "app name",
      "name",
    ]);

    const vendor = get(cols, ["vendor", "supplier"]);
    const domainHint = get(cols, ["domain", "business domain"]);
    const dispositionRaw = get(cols, ["disposition", "status", "lifecycle"]);

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

/**
 * Get a field from a row using fuzzy header matching.
 */
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
          let systemName = getField(row, [
            "application",
            "system",
            "application name",
            "app name",
            "name",
          ]);

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

          const vendor = getField(row, ["vendor", "supplier"]);
          const domainHint = getField(row, ["domain", "business domain"]);
          const dispositionRaw = getField(row, [
            "disposition",
            "status",
            "lifecycle",
          ]);

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
