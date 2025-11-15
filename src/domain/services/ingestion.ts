import type { InventoryRow } from "@/domain/model/modernization";

/**
 * Very simple CSV-ish parser:
 * - Assumes UTF-8 buffer
 * - First row is header
 * - Columns: Application/System, Vendor, Domain, Disposition
 */
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

  const getColumn = (row: string[], name: string) => {
    const idx = header.indexOf(name.toLowerCase());
    if (idx === -1) return "";
    return row[idx]?.trim() ?? "";
  };

  return lines.slice(1).map((line, idx) => {
    const cols = line.split(",");
    return {
      systemName: getColumn(cols, "application") || getColumn(cols, "system"),
      vendor: getColumn(cols, "vendor") || undefined,
      domainHint: getColumn(cols, "domain") || undefined,
      dispositionRaw: getColumn(cols, "disposition") || undefined,
      sourceRow: idx + 2, // header is row 1
    } as InventoryRow;
  });
}
