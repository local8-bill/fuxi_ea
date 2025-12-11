export type SequencerStep = {
  id: string;
  label: string;
  phase: string;
  region: string;
  system?: string;
  dependencies?: string[];
  cost: number;
  impact: number;
};

export type IntentEventOMS = {
  type: "intent:oms-sequence";
  payload: {
    region: string;
    phase: string;
    channels: string[];
    action?: "decouple" | "prioritize" | "focus";
    target?: string;
    timeline?: string;
  };
};

export type SequencerMutation = {
  mutationType: "updatePhase";
  targetRegion: string;
  updates: {
    phase?: string;
    timeline?: string;
    systems?: string[];
    dependencies?: string[];
  };
};
