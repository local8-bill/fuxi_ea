// Lightweight local “vision” adapter — no external calls.
// It pretends to read text from an image/PDF and extracts row-like hints.

export type ExtractedRow = {
  name: string;
  level: "L1" | "L2" | "L3";
  domain?: string;
  parent?: string;
};

function guessLevel(name: string): "L1" | "L2" | "L3" {
  // Tiny heuristic: longer -> deeper, purely for dev/demo
  const w = name.trim().split(/\s+/).length;
  if (w >= 5) return "L3";
  if (w >= 3) return "L2";
  return "L1";
}

function deriveRowsFromBuffer(_buf: ArrayBuffer): ExtractedRow[] {
  // Stub: in a real impl we’d OCR the buffer. For dev we emit a couple rows.
  return [
    { name: "Order Management", level: "L1", domain: "Core Ops" },
    { name: "Inventory", level: "L1", domain: "Core Ops" },
    { name: "Stock Visibility", level: "L2", parent: "Inventory" },
  ];
}

export const localVisionAdapter = {
  /**
   * Extract row candidates from a binary file (image/PDF/etc).
   * @param buffer ArrayBuffer of the uploaded file.
   * @param opts   Optional hints, e.g., { layoutHint: "mixed" }
   */
  async extract(buffer: ArrayBuffer, _opts?: Record<string, unknown>) {
    // Replace this with a real parser later; keep the API shape stable now.
    const rows = deriveRowsFromBuffer(buffer).map(r => ({
      ...r,
      // normalize “name → level” in case we want to alter heuristics later
      level: guessLevel(r.name),
    }));
    return rows;
  },
};
