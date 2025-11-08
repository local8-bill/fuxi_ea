// Return a CSS class for the overall band and a label to show if needed
export function colorBand(score01: number) {
  const s = Math.max(0, Math.min(1, score01 || 0));
  if (s < 0.35) return { band: "band-low", label: "Low" };
  if (s < 0.65) return { band: "band-med", label: "Medium" };
  if (s < 0.85) return { band: "band-high", label: "High" };
  return { band: "band-extreme", label: "Very High" };
}