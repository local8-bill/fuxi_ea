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

export type StageAwareness = {
  blastRadius: {
    dependencyLoad: number;
    criticalityWeight: number;
  };
  coupling: {
    financial: boolean;
    inventory: boolean;
    fulfillment: boolean;
    dataContract: boolean;
  };
  constraints: {
    blackout: boolean;
    governanceGate: boolean;
    rfpDependency: boolean;
  };
  storeFootprint: {
    storesCount: number;
    countriesCount: number;
    brandsCount: number;
  };
  riskFlags: string[];
  confidence: {
    overall: number;
    byField: Record<string, number>;
  };
};

export type ScenarioScope = {
  regions: string[];
  brands: string[];
  channels: string[];
  includeRetailLocations: boolean;
};

export type ScenarioConstraints = {
  blackoutWindows?: Array<{ start: string; end: string }>;
  deadlineYear?: string;
  budgetCapex?: number;
  budgetOpex?: number;
};

export type ScenarioDraft = {
  projectId: string;
  scenarioId: string;
  name: string;
  targetOutcome: string;
  scope: ScenarioScope;
  constraints: ScenarioConstraints;
  assumptions: string[];
  createdBy: string;
  createdAt: string;
  storeSummary?: {
    storeCount: number;
    countryCount: number;
    brandPresenceByRegion: Array<{ region: string; brands: string[]; stores: number }>;
    pilotRegionCandidates?: string[];
  };
};

export type StageProvenance = {
  sourceType: "transcript" | "user_input" | "graph_edge" | "heuristic" | "imported_asset";
  sourceRef?: string;
  note?: string;
};

export type SequenceDraftStage = {
  stageId: string;
  title: string;
  waveId?: string;
  waveLabel?: string;
  startLabel?: string;
  durationMonths?: number;
  systemsTouched?: string[];
  integrationsTouched?: string[];
  domainsTouched?: string[];
  regionScope?: string[];
  brandScope?: string[];
  channelScope?: string[];
  changeType?: "build" | "replace" | "decouple" | "migrate" | "retire";
  dependencies?: string[];
  cutoverType?: "go_live" | "migration" | "configuration" | "non_prod";
  intentTags?: string[];
  targets?: Array<{ goalType: string; targetDate?: string; budgetCap?: number }>;
  provenance?: StageProvenance[];
  awareness?: StageAwareness;
};

export type SequenceDraftWave = {
  waveId: string;
  name: string;
  start: string;
  end: string;
  goal?: string;
  stageIds: string[];
  provenance?: StageProvenance[];
};

export type SequenceDraft = {
  projectId: string;
  scenarioId?: string;
  sequenceId: string;
  name: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  fyStart?: string;
  fyEnd?: string;
  stageCount: number;
  waves?: SequenceDraftWave[];
  stages: SequenceDraftStage[];
  provenance?: StageProvenance[];
  status?: "DRAFT" | "REFINED" | "READY";
};

export type RefinementLogEntry = {
  logId: string;
  projectId?: string;
  sequenceId: string;
  scenarioId?: string;
  action: "auto_prompt" | "manual_edit" | "constraint_update" | "evidence_attach";
  message: string;
  authoredBy: string;
  createdAt: string;
  relatedStageIds?: string[];
  metadata?: Record<string, unknown>;
};

export type ConflictSetEntry = {
  conflictId: string;
  type: "shared_system" | "shared_integration" | "dependency_overlap" | "dual_run_split_brain" | "blackout_violation";
  objectRef?: string;
  stagesInvolved: string[];
  overlapWindow: { start: string; end: string };
  ruleFired: string;
  severity: number;
  explanation: string;
};

export type ConflictSet = {
  projectId: string;
  sequenceId: string;
  generatedAt: string;
  rulesVersion: string;
  conflicts: ConflictSetEntry[];
};

export type CalibrationEvent = {
  calibrationId: string;
  projectId: string;
  sequenceId: string;
  conflictId: string;
  userAction: "lower" | "confirm" | "raise" | "dismiss";
  reasonTags?: string[];
  deltaSeverity: number;
  authoredBy: string;
  createdAt: string;
};

export type RiskPostureSample = {
  projectId: string;
  sequenceId: string;
  score: number;
  band: "Guarded" | "Balanced" | "Aggressive";
  confidence: number;
  sampleSize: number;
  createdAt: string;
};

export type RoleReviewMode = "Architect" | "CFO" | "Ops" | "Readiness";

export type RoleReviewFinding = {
  findingId: string;
  reviewId: string;
  severity: "low" | "medium" | "high";
  summary: string;
  detail?: string;
  stageIds?: string[];
  systemIds?: string[];
  integrationIds?: string[];
  domainIds?: string[];
  recommendation?: string;
  decisionNeeded?: string;
  evidenceRefs?: string[];
};

export type RoleReviewRun = {
  reviewId: string;
  projectId: string;
  sequenceId: string;
  scenarioId?: string;
  role: RoleReviewMode;
  createdAt: string;
  generatedBy: "agent" | "user";
  model?: string;
  findings: RoleReviewFinding[];
  summary?: {
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
};

export type RoleReviewFeedback = {
  feedbackId: string;
  projectId: string;
  sequenceId: string;
  reviewId: string;
  findingId: string;
  action: "accept" | "dismiss" | "snooze";
  note?: string;
  authoredBy: string;
  createdAt: string;
};

export type DecisionLogEntry = {
  decisionId: string;
  projectId: string;
  sequenceId: string;
  title: string;
  decisionType: "sequencing" | "architecture_option" | "vendor_gate" | "risk_acceptance";
  options: string[];
  selectedOption: string;
  rationale?: string;
  linkedConflicts?: string[];
  owner: string;
  timestamp: string;
};

export type SequenceSnapshot = {
  snapshotId: string;
  projectId: string;
  sequenceId: string;
  version: string;
  createdAt: string;
  source: "user_save" | "agent_run" | "auto_checkpoint";
  sequence: SequenceDraft;
};
