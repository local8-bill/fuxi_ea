// Insight & AI Opportunity Engine controller (Directive 0003).
// Computes impact/effort and AI Opportunity Index for mock opportunities.

import {
  AI_PRIMITIVES,
  INDUSTRY_CASES,
  aiOpportunityIndex,
  toImpactEffortResult,
  type Opportunity,
} from "@/domain/knowledge";

type RawOpportunityInput = {
  id: string;
  title: string;
  summary: string;
  frictionZones: Opportunity["frictionZones"];
  primitives: Opportunity["primitives"];
  impact: number;
  effort: number;
  readiness?: number;
  tags?: string[];
  source?: string;
};

export function computeInsights(
  inputs: RawOpportunityInput[],
  saveToDisk = false,
): Opportunity[] {
  const results = inputs.map((item) => {
    const ie = toImpactEffortResult(item.impact, item.effort, item.readiness ?? 0);
    const score = aiOpportunityIndex(ie);
    const opp: Opportunity = {
      id: item.id,
      title: item.title,
      summary: item.summary,
      frictionZones: item.frictionZones,
      primitives: item.primitives,
      impactEffort: ie,
      aiOpportunityIndex: score,
      tags: item.tags,
      source: item.source,
    };
    return opp;
  });

  // Persistence intentionally disabled in this client-safe controller.
  // For server-side use, add a separate writer that runs in a Node context.

  return results;
}

// Provide a small mock set for the UI route to consume.
export function getMockInsights(): Opportunity[] {
  const samples: RawOpportunityInput[] = [
    {
      id: "opp-1",
      title: "Returns Triage Automation",
      summary: "Automate policy checks and routing for RMA/returns.",
      frictionZones: ["repetitive_tasks", "skill_bottlenecks"],
      primitives: ["automation", "data_analysis"],
      impact: 78,
      effort: 42,
      readiness: 62,
      tags: ["retail"],
      source: "mock",
    },
    {
      id: "opp-2",
      title: "Quality Insight CoPilot",
      summary: "Assist engineers with root-cause from sensor and maintenance logs.",
      frictionZones: ["navigating_ambiguity", "skill_bottlenecks"],
      primitives: ["research", "data_analysis"],
      impact: 70,
      effort: 55,
      readiness: 48,
      tags: ["manufacturing"],
      source: "mock",
    },
    {
      id: "opp-3",
      title: "Compliance Drafting Assistant",
      summary: "Draft findings and regulator communications from control tests.",
      frictionZones: ["repetitive_tasks", "skill_bottlenecks"],
      primitives: ["content_creation", "research"],
      impact: 65,
      effort: 38,
      readiness: 52,
      tags: ["financial-services"],
      source: "mock",
    },
  ];
  return computeInsights(samples, false);
}

export function listPrimitives() {
  return AI_PRIMITIVES;
}

export function listIndustryCases() {
  return INDUSTRY_CASES;
}
