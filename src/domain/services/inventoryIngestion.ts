export interface InventoryItem {
  systemName: string;
  raw: Record<string, string>;
}

export interface ParsedInventory {
  rows: InventoryItem[];
  uniqueSystems: number;
}

/**
 * Very simple CSV line parser:
 * - splits on commas
 * - trims whitespace
 * - strips outer quotes
 * This is sufficient for our current inventory format.
 */
function parseCsvLine(line: string): string[] {
  return line.split(",").map((cell) => {
    let v = cell.trim();
    if (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
      v = v.slice(1, -1);
    }
    return v;
  });
}

export function parseInventoryCsv(text: string): ParsedInventory {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], uniqueSystems: 0 };
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.trim());
  const lowerHeaders = headerCells.map((h) => h.toLowerCase());

  // Try to find a good "system name" column
  const nameHeaderCandidates = [
    "application name",
    "app name",
    "name",
    "vendor",
    "system",
    "application",
  ];

  let nameIndex = -1;
  for (const candidate of nameHeaderCandidates) {
    const idx = lowerHeaders.indexOf(candidate.toLowerCase());
    if (idx !== -1) {
      nameIndex = idx;
      break;
    }
  }

  const rows: InventoryItem[] = [];
  const systemSet = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = parseCsvLine(line);

    // Skip rows that are completely empty
    if (cells.every((c) => c.trim().length === 0)) continue;

    const record: Record<string, string> = {};
    headerCells.forEach((h, idx) => {
      record[h] = (cells[idx] ?? "").trim();
    });

    let systemName = "";

    if (nameIndex >= 0 && cells[nameIndex]) {
      systemName = cells[nameIndex].trim();
    }

    if (!systemName) {
      // Fallback: first non-empty cell in the row
      const found = cells.find((c) => c.trim().length > 0);
      if (found) {
        systemName = found.trim();
      }
    }

    if (systemName) {
      systemSet.add(systemName);
    }

    rows.push({
      systemName,
      raw: record,
    });
  }

  return {
    rows,
    uniqueSystems: systemSet.size,
  };
}
