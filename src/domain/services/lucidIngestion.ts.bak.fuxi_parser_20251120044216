import fs from "fs";
import path from "path";

// Lucid CSV ingestion tuned to header:
// ["Id","Name","Shape Library","Page ID","Contained By","Group",
//  "Line Source","Line Destination","Source Arrow","Destination Arrow",
//  "Status","Text Area 1","Text Area 2","Comments"]
//
// Rules:
// - Rows with Line Source / Line Destination => edges (integrations)
// - Rows WITHOUT line source/dest but WITH Text Area text => nodes (systems)
// - Node label comes from Text Area 1 / 2; we IGNORE Name ("Text", "Line", etc.)
// - Unlabeled shapes (no text) are ignored as systems.

const HEADER_DUMP_PATH = path.join(process.cwd(), "lucid_header_dump.txt");

export interface LucidNode {
  id: string;
  label: string;
  domain?: string | null;
  raw?: Record<string, string>;
}

export interface LucidEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string | null;
  raw?: Record<string, string>;
}

export interface LucidParseResult {
  nodes: LucidNode[];
  edges: LucidEdge[];
}

// Basic CSV → array of row objects
function parseCsvToRows(
  text: string
): { header: string[]; rows: Record<string, string>[] } {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    console.warn("[LucidIngestion] Empty CSV text");
    return { header: [], rows: [] };
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    console.warn("[LucidIngestion] CSV has header only or no lines", {
      lineCount: lines.length,
    });
    return { header: [], rows: [] };
  }

  const header = lines[0].split(",").map((h) => h.trim());
  console.log("[LucidIngestion] CSV header", { header });

  // Keep header dump for debugging
  try {
    fs.writeFileSync(HEADER_DUMP_PATH, JSON.stringify(header, null, 2), "utf8");
    console.log("[LucidIngestion] Header written to:", HEADER_DUMP_PATH);
  } catch (err) {
    console.warn("[LucidIngestion] Failed to write header dump", err);
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // NOTE: simple split – assumes no embedded commas in quoted fields.
    const values = line.split(",").map((v) => v.trim());
    if (values.length === 1 && values[0] === "") continue;

    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  console.log("[LucidIngestion] Parsed CSV rows", {
    rowCount: rows.length,
  });

  return { header, rows };
}

export function parseLucidCsv(csvText: string): LucidParseResult {
  console.log("[LucidIngestion] parseLucidCsv start", {
    textLength: csvText?.length ?? 0,
  });

  const { rows } = parseCsvToRows(csvText);
  const nodesMap = new Map<string, LucidNode>();
  const edges: LucidEdge[] = [];

  rows.forEach((row, idx) => {
    const id = (row["Id"] ?? "").trim();
    const name = (row["Name"] ?? "").trim(); // shape type (Text, Line, Process, etc.)
    const text1 = (row["Text Area 1"] ?? "").trim();
    const text2 = (row["Text Area 2"] ?? "").trim();
    const lineSource = (row["Line Source"] ?? "").trim();
    const lineDestination = (row["Line Destination"] ?? "").trim();

    const hasLine = !!lineSource || !!lineDestination;
    const hasText = !!text1 || !!text2;

    // Edge row: connectors / lines
    if (hasLine) {
      if (!lineSource || !lineDestination) {
        console.warn("[LucidIngestion] Skipping edge with missing endpoint", {
          index: idx,
          lineSource,
          lineDestination,
          row,
        });
        return;
      }

      const edgeLabel = text1 || text2 || null;

      const edge: LucidEdge = {
        id: `${lineSource}__${lineDestination}__${idx}`,
        sourceId: lineSource,
        targetId: lineDestination,
        label: edgeLabel,
        raw: row,
      };

      edges.push(edge);
      return;
    }

    // Node row: shapes with text (actual systems / steps)
    if (!hasText) {
      // Ignore unlabeled shapes; "Name" here is just shape type
      return;
    }

    const nodeId = id || `${name || "node"}__${idx}`;
    const label = text1 || text2 || name || nodeId;

    if (!nodesMap.has(nodeId)) {
      nodesMap.set(nodeId, {
        id: nodeId,
        label,
        domain: null, // domain will be inferred in a later pass
        raw: row,
      });
    }
  });

  const nodes = Array.from(nodesMap.values());

  console.log("[LucidIngestion] parseLucidCsv result", {
    nodeCount: nodes.length,
    edgeCount: edges.length,
  });

  const result: LucidParseResult = {
    nodes,
    edges,
  };

  return result;
}
