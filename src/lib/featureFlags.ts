export function aiScoringEnabled(): boolean {
  if (typeof process === "undefined") return false;
  const env = process.env.NEXT_PUBLIC_AI_SCORING_ENABLED;
  return env === "true" || env === "1";
}
