import type { AIPrimitiveDefinition } from "../schema";

export const AI_PRIMITIVES: AIPrimitiveDefinition[] = [
  {
    id: "content_creation",
    name: "Content Creation",
    description: "Generate or adapt text, media, and communications with brand and compliance controls.",
    exampleOutputs: ["Product descriptions", "Release notes", "Customer emails"],
  },
  {
    id: "research",
    name: "Research",
    description: "Synthesize information from documents, logs, and external sources to answer targeted questions.",
    exampleOutputs: ["Competitive brief", "Market scan", "Policy check"],
  },
  {
    id: "coding",
    name: "Coding",
    description: "Author, refactor, and review code with safeguards and tests.",
    exampleOutputs: ["Refactor diff", "Test scaffold", "API integration snippet"],
  },
  {
    id: "data_analysis",
    name: "Data Analysis",
    description: "Extract, transform, and summarize structured or semi-structured data for insight.",
    exampleOutputs: ["KPI summary", "Anomaly detection", "Trend breakdown"],
  },
  {
    id: "ideation_strategy",
    name: "Ideation / Strategy",
    description: "Propose options, scenarios, and roadmaps aligned to constraints and goals.",
    exampleOutputs: ["Roadmap options", "Scenario planning", "Mitigation ideas"],
  },
  {
    id: "automation",
    name: "Automation",
    description: "Orchestrate multi-step workflows and tool calls to reduce repetitive tasks.",
    exampleOutputs: ["Ticket triage", "Data sync", "Notification routing"],
  },
];

export function getPrimitiveById(id: string) {
  return AI_PRIMITIVES.find((p) => p.id === id);
}
