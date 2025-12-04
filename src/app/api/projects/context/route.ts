import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Lightweight stub for UXShell context
  const payload = {
    projectId: "demo",
    projectName: "Demo Workspace",
    mode: "Architect",
    recent: [
      { id: "700am", name: "700am — Core", status: "live" },
      { id: "951pm", name: "951pm — Pilot", status: "draft" },
      { id: "demo", name: "Demo Workspace", status: "demo" },
    ],
    status: {
      graph: { nodes: 122, edges: 97 },
      roi: { netROI: 2.7, breakEvenMonth: 0 },
      sequencer: { stages: 2, activeStage: "s1" },
    },
    actions: [
      "Review graph for Finance domain",
      "Validate ROI assumptions for Commerce",
      "Advance Sequencer to Stage 2",
    ],
  };
  return NextResponse.json(payload);
}
