import type { Capability } from "@/domain/model/capability";

export type ReasoningSuggestion = {
  sourceName: string;             // from extracted row
  action: "new" | "merge" | "attach";
  targetId?: string;              // when merge/attach
  reason?: string;                // short explanation
  domainHint?: string;            // if inferred
  levelHint?: "L1" | "L2" | "L3";
  parentHint?: string;            // name or id
};

export interface ReasoningPort {
  /** Suggest mappings from extracted names to our model tree */
  suggestMappings(
    extractedNames: string[],
    existing: Capability[]
  ): Promise<ReasoningSuggestion[]>;
}