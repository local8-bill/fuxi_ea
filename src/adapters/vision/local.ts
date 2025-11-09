import type { VisionPort, VisionExtractOptions, ExtractedRow } from "@/domain/ports/vision";

/**
 * Local heuristic extractor:
 * - Decodes text from simple images via <canvas> + OCR placeholder (future)
 * - For now, if the file is PDF or image with embedded text, require manual paste fallback.
 * - If user uploads a .txt or .csv by mistake, we still parse lines.
 */
export const localVisionAdapter: VisionPort = {
  async extract(bytes: ArrayBuffer, opts?: VisionExtractOptions): Promise<ExtractedRow[]> {
    // Minimal stub: try to detect text blob; if binary, return empty and let UI fall back to manual paste.
    // You can expand this with a small WASM OCR later.
    const u8 = new Uint8Array(bytes);
    const isPlainText = looksLikeText(u8);
    if (isPlainText) {
      const txt = new TextDecoder("utf-8").decode(u8);
      return linesToRows(txt, opts);
    }
    // Fallback: no-op; UI will message "use manual paste"
    return [];
  },
};

function looksLikeText(u8: Uint8Array): boolean {
  let printable = 0;
  const n = Math.min(u8.length, 4096);
  for (let i=0;i<n;i++){
    const c = u8[i];
    if (c === 9 || c === 10 || c === 13 || (c >= 32 && c < 127)) printable++;
  }
  return printable / Math.max(1,n) > 0.9;
}

function linesToRows(txt: string, opts?: VisionExtractOptions): ExtractedRow[] {
  const rows: ExtractedRow[] = [];
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    // Heuristic formats we’ll accept:
    // "L1: Order Management [Core Ops]"
    // "Order Capture -> Order Management (L2)"
    // "Returns, L2, parent=Order Management, domain=Core Ops"
    let name = line;
    let level: "L1" | "L2" | "L3" | undefined;
    let parent: string | undefined;
    let domain: string | undefined;

    const lvlMatch = line.match(/\bL([123])\b/i);
    if (lvlMatch) level = (`L${lvlMatch[1]}` as any);

    const parentMatch = line.match(/parent\s*=\s*([^,\]]+)/i) || line.match(/->\s*([^,]+)/);
    if (parentMatch) parent = parentMatch[1].trim();

    const domainMatch = line.match(/domain\s*=\s*([^,\]]+)/i) || line.match(/\[([^\]]+)\]$/);
    if (domainMatch) domain = domainMatch[1].trim();

    // strip tags from name:
    name = name
      .replace(/\[.*?\]/g, "")
      .replace(/\(L[123]\)/gi, "")
      .replace(/parent\s*=.*$/i, "")
      .replace(/domain\s*=.*$/i, "")
      .replace(/->.*$/i, "")
      .replace(/,\s*L[123]\b/i, "")
      .trim()
      .replace(/^[L1-3:]+\s*/i, "");

    if (name) rows.push({ name, level, parent, domain });
  }
  return rows;
}