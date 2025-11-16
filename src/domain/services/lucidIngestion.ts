import type {
  DigitalEnterpriseItem,
} from "@/domain/services/digitalEnterpriseStore";

type ParseParams = {
  projectId: string;
  view: string; // "future" | "current" etc. (kept for future use)
};

function splitCsvLine(line: string): string[] {
  // Good enough for Lucid’s simple export (no fancy quoting in labels we care about)
  return line.split(",");
}

export function parseLucidCsv(
  buffer: Buffer,
  params: ParseParams,
): DigitalEnterpriseItem[] {
  const csvText = buffer.toString("utf8");
  const rawLines = csvText.split(/\r?\n/);

  const lines = rawLines
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error("Lucid CSV is empty or missing header row");
  }

  const header = splitCsvLine(lines[0]);

  const idxId = header.indexOf("Id");
  const idxName = header.indexOf("Name");
  const idxShapeLib = header.indexOf("Shape Library");
  const idxSrc = header.indexOf("Line Source");
  const idxDst = header.indexOf("Line Destination");
  const idxText1 = header.indexOf("Text Area 1");
  const idxStatus = header.indexOf("Status");

  if (idxId === -1) {
    throw new Error("Lucid CSV missing Id column");
  }

  const items: DigitalEnterpriseItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (!row.length) continue;

    const id = (row[idxId] ?? "").trim();
    if (!id) continue;

    const name = idxName >= 0 ? (row[idxName] ?? "").trim() : "";
    const text1 = idxText1 >= 0 ? (row[idxText1] ?? "").trim() : "";
    const labelRaw = name || text1;

    const shapeLib =
      idxShapeLib >= 0 ? (row[idxShapeLib] ?? "").trim() : "";
    const src = idxSrc >= 0 ? (row[idxSrc] ?? "").trim() : "";
    const dst = idxDst >= 0 ? (row[idxDst] ?? "").trim() : "";
    const status =
      idxStatus >= 0 ? (row[idxStatus] ?? "").trim() : "";

    const label = labelRaw.trim();

    // Heuristic: if we have a Line Source / Line Destination, treat as integration
    if (src || dst) {
      items.push({
        projectId: params.projectId,
        kind: "integration",
        id: `edge:${id}`,
        label:
          label ||
          (src && dst
            ? `${src} → ${dst}`
            : src || dst || `integration-${id}`),
        sourceId: src || undefined,
        targetId: dst || undefined,
      });
      continue;
    }

    // Otherwise, potential system node.
    // Filter out obvious non-systems like the Document/Page rows with no meaningful label.
    if (!label) {
      continue;
    }

    // Optional: skip the top-level document or page rows
    const lowered = label.toLowerCase();
    if (lowered === "document" || lowered === "page") {
      continue;
    }

    items.push({
      projectId: params.projectId,
      kind: "system",
      id: `node:${id}`,
      label,
      // status could be used later (e.g., “Draft”, “Future”), for now we ignore it.
    });
  }

  return items;
}
