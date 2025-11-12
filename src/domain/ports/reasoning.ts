// src/domain/ports/reasoning.ts

export type ReasoningAction = "merge" | "attach" | "new";

export type ReasoningAlignRow = {
  id?: string;
  name: string;
  level: string;      // "L1" | "L2" | "L3" (we keep string for flexibility)
  domain?: string;
  parent?: string;
};

export type ReasoningSuggestion = {
  sourceName: string;
  action: ReasoningAction;
  targetId?: string;  // optional – AI may not set this yet
  reason: string;
};

export type ReasoningAlignInput = {
  rows: ReasoningAlignRow[];
  existingL1: string[];
};

export type ReasoningAlignResult = {
  suggestions: ReasoningSuggestion[];
  issues: string[];   // human-readable notes
};

export interface ReasoningPort {
  align(input: ReasoningAlignInput): Promise<ReasoningAlignResult>;
}
