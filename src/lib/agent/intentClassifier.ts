import type { AgentIntent, AgentIntentActionType, AgentSession } from "@/types/agent";
import { detectDemoTopic } from "./demoScripts";

type IntentCandidate = {
  id: AgentIntent["id"];
  label: string;
  keywords: string[];
  action?: { type: AgentIntentActionType; params?: Record<string, unknown> };
  responseHint: string;
  baseConfidence: number;
};

const INTENT_CANDIDATES: IntentCandidate[] = [
  {
    id: "roi_summary",
    label: "ROI Summary",
    keywords: ["roi", "return", "finance", "breakeven", "benefit", "payback"],
    action: { type: "roi.summary" },
    responseHint: "Compiling ROI projections and break-even timeline.",
    baseConfidence: 0.78,
  },
  {
    id: "graph_harmonization",
    label: "Harmonize Graph",
    keywords: ["graph", "harmoniz", "map", "digital enterprise", "systems"],
    action: { type: "graph.harmonize" },
    responseHint: "Loading harmonized systems and preparing Digital Enterprise.",
    baseConfidence: 0.74,
  },
  {
    id: "sequencer_plan",
    label: "Sequencer Plan",
    keywords: ["sequence", "roadmap", "plan", "waves", "modernize"],
    action: { type: "sequence.plan", params: { strategy: "value" } },
    responseHint: "Drafting modernization waves aligned to dependencies.",
    baseConfidence: 0.73,
  },
  {
    id: "review_resume",
    label: "Review Resume",
    keywords: ["review", "approval", "sign off", "delta"],
    action: { type: "review.resume" },
    responseHint: "Surfacing the latest harmonization deltas for review.",
    baseConfidence: 0.66,
  },
  {
    id: "context_followup",
    label: "Context Follow-up",
    keywords: ["continue", "resume", "where", "left off", "context"],
    action: { type: "context.reminder" },
    responseHint: "Resuming where we left off with project context applied.",
    baseConfidence: 0.6,
  },
  {
    id: "demo_walkthrough",
    label: "Demo Walkthrough",
    keywords: ["walk", "demo", "explain", "show me", "how do"],
    action: { type: "demo.explain" },
    responseHint: "Let me walk you through that step by step.",
    baseConfidence: 0.65,
  },
];

const PLATFORM_KEYWORDS = ["erp", "crm", "commerce", "finance", "data", "integration", "analytics", "hr", "supply", "planning"];

export function extractFocusAreas(input: string): string[] {
  const normalized = input.toLowerCase();
  const hits = new Set<string>();
  PLATFORM_KEYWORDS.forEach((keyword) => {
    if (normalized.includes(keyword)) hits.add(keyword);
  });
  return Array.from(hits);
}

export function classifyIntent(input: string, session: AgentSession): AgentIntent {
  const normalized = input.toLowerCase();
  let winner: IntentCandidate | null = null;
  let winnerScore = 0;

  for (const candidate of INTENT_CANDIDATES) {
    const matches = candidate.keywords.reduce((count, keyword) => (normalized.includes(keyword) ? count + 1 : count), 0);
    if (matches === 0) continue;
    const score = candidate.baseConfidence + matches * 0.05;
    if (score > winnerScore) {
      winner = candidate;
      winnerScore = score;
    }
  }

  const fallback: AgentIntent = {
    id: "contextual_support",
    label: "Contextual Support",
    confidence: 0.42,
    responseHint: "Capturing your request and routing it through the assistant stack.",
  };

  if (!winner) {
    return fallback;
  }

  const intent: AgentIntent = {
    id: winner.id,
    label: winner.label,
    confidence: Math.min(0.98, winnerScore),
    responseHint: winner.responseHint,
    action: winner.action,
  };

  if (intent.id === "demo_walkthrough") {
    const topic = detectDemoTopic(input) ?? "harmonization";
    intent.action = { type: "demo.explain", params: { topic } };
    intent.responseHint = `I'll narrate the ${topic} flow so you can follow along.`;
  }

  const lastIntent = session.memory.lastIntent;
  if (lastIntent === winner.id) {
    intent.confidence = Math.max(intent.confidence, 0.85);
  }

  return intent;
}
