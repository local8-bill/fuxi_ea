import type { AgentTone } from "@/types/agent";

type TemplateMap = Record<string, Record<AgentTone, string>>;

type TemplateContext = {
  summary?: string;
  options?: string;
  strategy?: string;
  waveCount?: number;
  focus?: string;
};

const actionTemplates: TemplateMap = {
  "graph.harmonize": {
    formal: "Harmonization completed. ${summary}",
    neutral: "Here’s your harmonized view. ${summary}",
    concise: "${summary}",
  },
  "sequence.plan": {
    formal: "Sequencing generated (${strategy}). ${summary}",
    neutral: "I’ve drafted the modernization waves (${strategy}). ${summary}",
    concise: "${summary} (${strategy})",
  },
  "roi.summary": {
    formal: "ROI forecast ready. ${summary}",
    neutral: "Here’s the ROI pulse. ${summary}",
    concise: "${summary}",
  },
  "review.resume": {
    formal: "Review queue updated. ${summary}",
    neutral: "Review context is ready. ${summary}",
    concise: "${summary}",
  },
};

function fill(template: string, ctx: TemplateContext) {
  return template
    .replace("${summary}", ctx.summary ?? "")
    .replace("${strategy}", ctx.strategy ?? "value")
    .replace("${options}", ctx.options ?? "")
    .replace("${focus}", ctx.focus ?? "");
}

export function renderActionTemplate(actionType: string, tone: AgentTone, context: TemplateContext): string {
  const template = actionTemplates[actionType]?.[tone] ?? context.summary ?? "";
  return fill(template, context).trim();
}
