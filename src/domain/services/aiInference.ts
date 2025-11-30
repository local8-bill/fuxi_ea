import type { HarmonizedSystem } from "./harmonization";

export type AIAction = "replace" | "modernize" | "retire" | "keep" | "rename";

export function inferTransformation(system: HarmonizedSystem): AIAction | null {
  const state = system.state;
  const confidence = system.confidence ?? 0;

  if (state === "added") {
    return confidence > 0.7 ? "replace" : "keep";
  }
  if (state === "removed") {
    return confidence > 0.7 ? "retire" : "replace";
  }
  if (state === "modified") {
    return confidence > 0.5 ? "modernize" : "keep";
  }
  if (state === "unchanged") {
    return confidence > 0.8 ? "keep" : null;
  }
  return null;
}
