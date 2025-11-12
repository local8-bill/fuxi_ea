export type FlatRow = {
  id?: string;
  name: string;
  level: "L1" | "L2" | "L3";
  domain?: string;
  parent?: string;
};

export type ReasoningAction = "merge" | "attach" | "new";

export type ReasoningSuggestion = {
  sourceName: string;     // incoming node name
  action: ReasoningAction;// what to do with it
  targetId?: string;      // if merge/attach, which existing id
  reason: string;         // why we think that
};

export type ReasoningAlignInput = {
  rows: FlatRow[];        // parsed incoming rows (flattened)
  existingL1: string[];   // current project L1 names (for quick hints)
};

export type ReasoningAlignResult = {
  suggestions: ReasoningSuggestion[];
  issues: string[];
};

export interface ReasoningPort {
  align(input: ReasoningAlignInput): Promise<ReasoningAlignResult>;
}
