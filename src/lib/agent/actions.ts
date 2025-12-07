import fs from "node:fs/promises";
import path from "node:path";
import { forecastByDomain } from "@/domain/services/roi";
import type { AgentIntentAction, AgentSession, AgentCard, AgentLink } from "@/types/agent";
import { appendSessionMessage, loadAgentSession, saveAgentSession } from "./sessionStore";
import { recordTelemetry } from "@/lib/telemetry/server";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const GRAPH_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

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

async function loadGraphSummary(focusAreas: string[]): Promise<{ systems: number; integrations: number; domains: number }> {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf8");
    const json = JSON.parse(raw);
    let nodes: Array<{ platform?: string; domain?: string }> = Array.isArray(json?.nodes) ? json.nodes : [];
    if (focusAreas.length) {
      nodes = nodes.filter((node) => {
        const platform = String(node.platform ?? "").toLowerCase();
        return focusAreas.some((focus) => platform.includes(focus));
      });
    }
    const edges = Array.isArray(json?.edges) ? json.edges : [];
    const domains = new Set(nodes.map((n) => n.domain).filter(Boolean));
    return { systems: nodes.length, integrations: edges.length, domains: domains.size };
  } catch {
    return { systems: 0, integrations: 0, domains: 0 };
  }
}

function buildSequencerPlan(focusAreas: string[], strategy = "value") {
  const base = [
    { id: "wave-1", title: "Stabilize Core", focus: focusAreas.slice(0, 2).join(", ") || "ERP / OMS", timelineMonths: [0, 3] as [number, number] },
    { id: "wave-2", title: "Modernize Experience", focus: focusAreas.slice(2, 4).join(", ") || "Commerce / Integration", timelineMonths: [3, 6] as [number, number] },
    { id: "wave-3", title: "Scale Intelligence", focus: focusAreas.slice(4, 6).join(", ") || "Data / Analytics", timelineMonths: [6, 9] as [number, number] },
  ];
  return { waves: base, strategy };
}

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

  switch (action.type) {
    case "roi.summary": {
      const forecast = await forecastByDomain(5);
      const { netROI, breakEvenMonth, totalBenefit, totalCost } = forecast.predictions;
      const netPct = typeof netROI === "number" ? `${Math.round(netROI * 100)}%` : "—";
      const summary = `ROI ready. Net ROI ${netPct} with break-even month ${breakEvenMonth ?? "—"}.`;
      result = {
        summary,
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
      const summaryData = await loadGraphSummary(focusAreas);
      const summary = `Harmonized ${summaryData.systems} systems across ${summaryData.domains} domains. ${
        summaryData.integrations
      } integration links ready.`;
      result = {
        summary,
        card: {
          type: "harmonization",
          systems: summaryData.systems,
          integrations: summaryData.integrations,
          domains: summaryData.domains,
          focusAreas,
        },
        link: { label: "Open Digital Enterprise", href: `/project/${projectId}/digital-enterprise` },
      };
      break;
    }
    case "sequence.plan": {
      const plan = buildSequencerPlan(focusAreas, String(action.params?.strategy ?? "value"));
      const summary = `Generated ${plan.waves.length} modernization waves (${plan.strategy} strategy).`;
      result = {
        summary,
        card: {
          type: "sequence",
          waves: plan.waves,
          strategy: plan.strategy,
        },
        link: { label: "Open Sequencer", href: `/project/${projectId}/transformation-dialogue` },
      };
      break;
    }
    case "review.resume": {
      const highlights = buildReviewHighlights(focusAreas, context.mode);
      const summary = `Review queue ready with ${highlights.length} highlights.`;
      result = {
        summary,
        card: {
          type: "review",
          highlights,
        },
        link: { label: "Open Review", href: `/project/${projectId}/harmonization-review` },
      };
      break;
    }
    default: {
      const summary = "Context noted. I’ll keep listening for the next request.";
      result = { summary };
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
