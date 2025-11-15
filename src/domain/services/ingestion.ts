import type { InventoryRow } from "../model/modernization";

export async function parseInventoryExcel(buffer: Buffer): Promise<InventoryRow[]> {
  const text = buffer.toString("utf8");
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) return [];

  const header = lines[0]
    .split(",")
    .map((col) => col.trim().toLowerCase());

  const columnValue = (row: string[], name: string) => {
    const idx = header.indexOf(name.toLowerCase());
    if (idx === -1) return "";
    return row[idx]?.trim() ?? "";
  };

  return lines.slice(1).map((line, idx) => {
    const cols = line.split(",");
    return {
      systemName: columnValue(cols, "application") || columnValue(cols, "system"),
      vendor: columnValue(cols, "vendor") || undefined,
      domainHint: columnValue(cols, "domain") || undefined,
      dispositionRaw: columnValue(cols, "disposition") || undefined,
      sourceRow: idx + 2,
    };
  });
}
