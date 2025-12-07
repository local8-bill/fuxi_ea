import type { AgentTone } from "@/types/agent";

export function composeUtterance(
  tone: AgentTone,
  parts: { acknowledge: string; reflect?: string; respond: string; prompt?: string },
): string {
  const segments = [parts.acknowledge];
  if (parts.reflect) segments.push(parts.reflect);
  segments.push(parts.respond);
  if (parts.prompt) segments.push(parts.prompt);
  return segments.join("\n");
}

export function buildAcknowledgement(tone: AgentTone, message?: string) {
  const trimmed = message?.trim();
  const subject = trimmed ? trimmed.slice(0, 80) : "that";
  if (tone === "formal") return `Acknowledged. ${subject}.`;
  if (tone === "concise") return `Got it — ${subject}.`;
  return `Understood. ${subject}.`;
}

export function promptForIntent(intentId?: string): string {
  switch (intentId) {
    case "graph_harmonization":
      return "Ready to open the harmonized graph when you are.";
    case "roi_summary":
      return "Want me to surface the ROI deltas next?";
    case "sequencer_plan":
      return "I can outline the waves or compare strategies.";
    case "review_resume":
      return "Shall I bring the latest review queue forward?";
    default:
      return "Let me know if you want me to drive the next step.";
  }
}

export function promptForAction(actionType: string): string {
  switch (actionType) {
    case "graph.harmonize":
      return "Need me to summarize overlaps by platform?";
    case "sequence.plan":
      return "Want to compare value vs. complexity sequencing?";
    case "roi.summary":
      return "Should I push these metrics into the ROI deck?";
    case "review.resume":
      return "Ready to flag any blocking deltas.";
    default:
      return "Happy to continue when you are.";
  }
}

export function completionAcknowledgement(tone: AgentTone) {
  if (tone === "formal") return "Execution completed.";
  if (tone === "concise") return "Done.";
  return "All set.";
}
