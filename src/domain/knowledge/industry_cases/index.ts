import type { IndustryCase } from "../schema";

export const INDUSTRY_CASES: IndustryCase[] = [
  {
    id: "retail-returns-ops",
    industry: "Retail",
    challenge: "High-volume returns triage with manual policy checks.",
    primitives: ["automation", "data_analysis"],
    frictionZones: ["repetitive_tasks", "skill_bottlenecks"],
    notes: "Uses RMA policy parsing + workflow automation.",
  },
  {
    id: "mfg-quality-insights",
    industry: "Manufacturing",
    challenge: "Slow root-cause analysis from sensor and maintenance logs.",
    primitives: ["research", "data_analysis"],
    frictionZones: ["navigating_ambiguity", "skill_bottlenecks"],
    notes: "Blends anomaly detection with guided investigation steps.",
  },
  {
    id: "fs-compliance-drafting",
    industry: "Financial Services",
    challenge: "Manual control testing summaries and regulator communications.",
    primitives: ["content_creation", "research"],
    frictionZones: ["repetitive_tasks", "skill_bottlenecks"],
    notes: "Drafts findings, highlights gaps; routed for human approval.",
  },
];
