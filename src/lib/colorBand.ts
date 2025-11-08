export type Band = "band-low" | "band-med" | "band-high" | "band-extreme";

export function colorBand(score: number): Band {
  const pct = score > 1 ? score : score * 100;
  if (pct >= 85) return "band-extreme";
  if (pct >= 70) return "band-high";
  if (pct >= 50) return "band-med";
  return "band-low";
}