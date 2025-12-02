export type ConnectionDecision = {
  decision: "confirmed" | "rejected";
  confidence: number;
};

export function updateConfidenceModel(decisions: ConnectionDecision[]): { weightAdjustment: number } {
  if (!decisions.length) return { weightAdjustment: 0 };
  const confirmed = decisions.filter((d) => d.decision === "confirmed").length;
  const ratio = confirmed / decisions.length;
  // Simple stub: more confirmations -> increase weight slightly, more rejections -> decrease.
  const weightAdjustment = Number((ratio - 0.5).toFixed(2));
  return { weightAdjustment };
}
