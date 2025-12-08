export type AgentRole = "system" | "assistant" | "user";

export type AgentCard =
  | {
      type: "roi";
      netROI: number | null;
      breakEvenMonth: number | null;
      totalBenefit: number;
      totalCost: number;
      contextFocus?: string[];
    }
  | {
      type: "harmonization";
      systems: number;
      integrations: number;
      domains: number;
      focusAreas?: string[];
    }
  | {
      type: "sequence";
      waves: Array<{ id: string; title: string; focus?: string; timelineMonths?: [number, number] }>;
      strategy: string;
    }
  | {
      type: "review";
      highlights: string[];
    }
  | {
      type: "walkthrough";
      title: string;
      steps: Array<{ id: string; title: string; detail: string }>;
      completion: string;
    };

export interface AgentLink {
  label: string;
  href: string;
}

export interface AgentDesignLock {
  id: string;
  directive: string;
  principle: string;
  rationale: string;
  guardrails: string[];
  references: string[];
}

export interface AgentMessage {
  id: string;
  role: AgentRole;
  content: string;
  ts: number;
  intent?: string;
  action?: string;
  card?: AgentCard;
  link?: AgentLink;
}

export type AgentTone = "formal" | "neutral" | "concise";

export type ToneProfile = {
  formality: AgentTone;
  verbosity: "low" | "medium" | "high";
  keywords: string[];
};

export interface AgentMemory {
  focusAreas: string[];
  lastIntent?: string;
  lastView?: string;
  lastMode?: string;
  toneProfile?: ToneProfile;
  designLocks?: AgentDesignLock[];
}

export interface AgentSession {
  projectId: string;
  messages: AgentMessage[];
  memory: AgentMemory;
  updatedAt: string;
}

export type AgentIntentActionType =
  | "roi.summary"
  | "graph.harmonize"
  | "sequence.plan"
  | "review.resume"
  | "context.reminder"
  | "demo.explain";

export interface AgentIntentAction {
  type: AgentIntentActionType;
  params?: Record<string, unknown>;
}

export interface AgentIntent {
  id: string;
  label: string;
  confidence: number;
  action?: AgentIntentAction;
  responseHint: string;
}

export interface AgentTelemetryEvent {
  event_type: string;
  timestamp: string;
  workspace_id?: string;
  data?: Record<string, unknown>;
}

export interface AgentContextSnapshot {
  projectId: string;
  mode: string;
  view: string;
  recentTelemetry: AgentTelemetryEvent[];
  session: AgentSession;
}
