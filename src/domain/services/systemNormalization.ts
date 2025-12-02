/**
 * Shared system-name normalization for inventory + diagram comparison.
 *
 * Goals (v1):
 * - case-insensitive comparison
 * - ignore leading/trailing whitespace
 * - strip quotes and most punctuation
 * - collapse multiple spaces
 *
 * Example:
 *   "  Oracle EBS™ " -> "oracle ebs"
 *   "DOMS (Order Mgmt)" -> "doms order mgmt"
 */
export function normalizeSystemName(raw: string | null | undefined): string {
  if (!raw) return "";

  let s = String(raw).trim();

  if (!s) return "";

  // Strip surrounding quotes if present
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // Remove most punctuation, keep letters/numbers/spaces
  s = s.replace(/[^a-zA-Z0-9\s]/g, " ");

  // Collapse multiple whitespace to a single space
  s = s.replace(/\s+/g, " ").trim();

  return s.toLowerCase();
}
