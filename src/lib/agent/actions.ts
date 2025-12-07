import { forecastByDomain } from "@/domain/services/roi";
import type { AgentIntentAction, AgentSession, AgentCard, AgentLink } from "@/types/agent";
import { appendSessionMessage, loadAgentSession, saveAgentSession } from "./sessionStore";
import { recordTelemetry } from "@/lib/telemetry/server";
import { loadHarmonizationSummary } from "@/lib/harmonization/summary";
import { buildSequencerPlan } from "@/lib/sequencer/plan";
import { composeUtterance, promptForAction, completionAcknowledgement } from "@/lib/agent/tone";
import { defaultToneProfile } from "@/lib/agent/toneProfile";
import { renderActionTemplate } from "@/lib/agent/templates";
import { getDemoScript } from "@/lib/agent/demoScripts";

type ActionContext = {
  mode?: string;
  view?: string;
  focusAreas?: string[];
};

type ExecutionResult = {
  summary: string;
  card?: AgentCard;
  link?: AgentLink;
};

function buildReviewHighlights(focusAreas: string[], mode?: string) {
  const highlights = [
    `Alignment drift detected in ${focusAreas[0] ?? "core platforms"}.`,
    mode === "CFO" ? "Finance requested confirmation on ROI guardrails." : "Architect view ready for dependency validation.",
    "Sequencer is ready for next approval stage.",
  ];
  return highlights;
}

export async function performAgentAction(
  projectId: string,
  action: AgentIntentAction,
  context: ActionContext = {},
): Promise<{ session: AgentSession; result: ExecutionResult }> {
  const { session } = await loadAgentSession(projectId);
  const focusAreas = context.focusAreas ?? session.memory.focusAreas ?? [];
  let result: ExecutionResult;
  const toneProfile = session.memory.toneProfile ?? defaultToneProfile();
  const tone = toneProfile.formality;
  const acknowledge = completionAcknowledgement(tone);
  const reflect = focusAreas.length ? `Focus: ${focusAreas.join(", ")}.` : undefined;
  const telemetryQueue: Array<{ event_type: string; data: Record<string, unknown> }> = [];

  switch (action.type) {
    case "roi.summary": {
      const forecast = await forecastByDomain(5);
      const { netROI, breakEvenMonth, totalBenefit, totalCost } = forecast.predictions;
      const netPct = typeof netROI === "number" ? `${Math.round(netROI * 100)}%` : "—";
      const summary = `ROI ready. Net ROI ${netPct} with break-even month ${breakEvenMonth ?? "—"}.`;
      const rendered = renderActionTemplate(action.type, tone, { summary });
      telemetryQueue.push({
        event_type: "template_used",
        data: { projectId, intent: action.type, tone, template: action.type },
      });
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          reflect,
          respond: rendered,
          prompt: promptForAction(action.type),
        }),
        card: {
          type: "roi",
          netROI,
          breakEvenMonth,
          totalBenefit,
          totalCost,
          contextFocus: focusAreas,
        },
        link: { label: "Open ROI Dashboard", href: `/project/${projectId}/roi-dashboard` },
      };
      break;
    }
    case "graph.harmonize": {
      const summaryData = await loadHarmonizationSummary(focusAreas);
      const topOverlap = summaryData.platformBreakdown.slice(0, 2).map((entry) => entry.platform).join(" & ");
      const overlapHint = topOverlap ? ` ${topOverlap} show the highest overlap.` : "";
      const summary = `Harmonized ${summaryData.systems} systems across ${summaryData.domains} domains. ${
        summaryData.integrations
      } integration links ready.${overlapHint}`;
      const rendered = renderActionTemplate(action.type, tone, { summary, focus: focusAreas.join(", ") });
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          reflect,
          respond: rendered,
          prompt: promptForAction(action.type),
        }),
        card: {
          type: "harmonization",
          systems: summaryData.systems,
          integrations: summaryData.integrations,
          domains: summaryData.domains,
          focusAreas,
        },
        link: { label: "Open Digital Enterprise", href: `/project/${projectId}/digital-enterprise` },
      };
      telemetryQueue.push({
        event_type: "template_used",
        data: { projectId, intent: action.type, tone, template: action.type },
      });
      telemetryQueue.push({
        event_type: "harmonization_completed",
        data: {
          projectId,
          platforms: focusAreas,
          summary: summaryData,
          overlaps: summaryData.platformBreakdown,
        },
      });
      break;
    }
    case "sequence.plan": {
      const plan = buildSequencerPlan(focusAreas, String(action.params?.strategy ?? "value"));
      const summary = `Generated ${plan.waves.length} modernization waves (${plan.strategy} strategy).`;
      const rendered = renderActionTemplate(action.type, tone, {
        summary,
        strategy: plan.strategy,
        waveCount: plan.waves.length,
      });
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          reflect,
          respond: rendered,
          prompt: promptForAction(action.type),
        }),
        card: {
          type: "sequence",
          waves: plan.waves,
          strategy: plan.strategy,
        },
        link: { label: "Open Sequencer", href: `/project/${projectId}/transformation-dialogue` },
      };
      telemetryQueue.push({
        event_type: "template_used",
        data: { projectId, intent: action.type, tone, template: action.type },
      });
      telemetryQueue.push({
        event_type: "sequencing_generated",
        data: {
          projectId,
          strategy: plan.strategy,
          platforms: focusAreas,
          waves: plan.waves,
        },
      });
      break;
    }
    case "review.resume": {
      const highlights = buildReviewHighlights(focusAreas, context.mode);
      const summary = `Review queue ready with ${highlights.length} highlights.`;
      const rendered = renderActionTemplate(action.type, tone, { summary });
      telemetryQueue.push({
        event_type: "template_used",
        data: { projectId, intent: action.type, tone, template: action.type },
      });
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          reflect,
          respond: rendered,
          prompt: promptForAction(action.type),
        }),
        card: {
          type: "review",
          highlights,
        },
        link: { label: "Open Review", href: `/project/${projectId}/harmonization-review` },
      };
      break;
    }
    case "demo.explain": {
      const topic = typeof action.params?.topic === "string" ? action.params.topic : undefined;
      const script = getDemoScript(topic);
      telemetryQueue.push({ event_type: "assistive_mode_triggered", data: { projectId, topic: script.topic } });
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          respond: script.summary,
          prompt: script.completion,
        }),
        card: {
          type: "walkthrough",
          title: script.title,
          steps: script.steps,
          completion: script.completion,
        },
      };
      break;
    }
    default: {
      const summary = "Context noted. I’ll keep listening for the next request.";
      result = {
        summary: composeUtterance(tone, {
          acknowledge,
          reflect,
          respond: summary,
          prompt: promptForAction(action.type),
        }),
      };
    }
  }

  appendSessionMessage(session, {
    role: "assistant",
    content: result.summary,
    action: action.type,
    intent: action.type,
    card: result.card,
    link: result.link,
  });

  await saveAgentSession(session);

  for (const entry of telemetryQueue) {
    await recordTelemetry({
      event_type: entry.event_type,
      workspace_id: "uxshell",
      data: entry.data,
    });
  }

  await recordTelemetry({
    event_type: "agent_action_executed",
    workspace_id: "uxshell",
    data: {
      projectId,
      action: action.type,
      mode: context.mode,
      view: context.view,
      focus: focusAreas,
    },
  });

  return { session, result };
}
