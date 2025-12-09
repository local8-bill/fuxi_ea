import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ProjectStatus = "LIVE" | "DRAFT" | "DEMO";
type ModeKey = "Architect" | "Analyst" | "FP&A" | "CFO" | "CIO";
type ViewKey = "graph" | "roi" | "sequencer" | "review" | "digital";

const PROJECTS: Array<{
  id: string;
  name: string;
  status: ProjectStatus;
  health: "steady" | "at-risk" | "on-track";
  lastView: ViewKey;
  lastMode: ModeKey;
  summary: string;
  nextAction: string;
}> = [
  {
    id: "700am",
    name: "700am — Core",
    status: "LIVE",
    health: "on-track",
    lastView: "roi",
    lastMode: "Architect",
    summary: "Core modernization wave is staged with ROI scenarios available.",
    nextAction: "Review ROI 2 actuals before unlocking Sequencer.",
  },
  {
    id: "951pm",
    name: "951pm — Pilot",
    status: "DRAFT",
    health: "steady",
    lastView: "graph",
    lastMode: "Analyst",
    summary: "Pilot workspace is harmonizing systems before finance review.",
    nextAction: "Highlight integration blockers on the graph.",
  },
  {
    id: "demo",
    name: "Demo Workspace",
    status: "DEMO",
    health: "at-risk",
    lastView: "sequencer",
    lastMode: "CFO",
    summary: "Scenario B requires cost guardrails before executive playback.",
    nextAction: "Sequence modernization waves with budget guardrails.",
  },
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? PROJECTS[0]?.id ?? "demo";
  const project = PROJECTS.find((p) => p.id === projectId) ?? PROJECTS[0];

  return NextResponse.json({
    ok: true,
    project,
    projects: PROJECTS,
    recent: PROJECTS.map((p) => ({ id: p.id, name: p.name, status: p.status.toLowerCase() })),
    actions: [
      "Review graph for Finance domain",
      "Validate ROI assumptions for Commerce",
      "Advance Sequencer to Stage 2",
    ],
  });
}
