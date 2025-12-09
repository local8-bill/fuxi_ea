import { NextRequest, NextResponse } from "next/server";

type ModeKey = "Architect" | "Analyst" | "FP&A" | "CFO" | "CIO";

const MODE_SUMMARIES: Record<
  ModeKey,
  {
    metrics: Array<{ label: string; value: string; delta?: string }>;
    highlights: string[];
  }
> = {
  Architect: {
    metrics: [
      { label: "Systems Harmonized", value: "124", delta: "+8 since Monday" },
      { label: "Integration Alerts", value: "3 open", delta: "-2" },
      { label: "Readiness", value: "88%", delta: "+4%" },
    ],
    highlights: [
      "Sequencer wave 2 is ready for dependency confirmation.",
      "Digital enterprise graph filtered to Commerce + Finance domains.",
    ],
  },
  Analyst: {
    metrics: [
      { label: "Signals Ready", value: "12", delta: "+3" },
      { label: "Anomalies", value: "2 flagged" },
      { label: "Data freshness", value: "6 hrs" },
    ],
    highlights: [
      "ROI scenario B variance exceeds 6% threshold.",
      "KPI panel recommends revisiting Sequencer timeline.",
    ],
  },
  "FP&A": {
    metrics: [
      { label: "Net ROI", value: "212%", delta: "+12%" },
      { label: "Break-even", value: "Month 14" },
      { label: "Benefit at risk", value: "$4.2M" },
    ],
    highlights: ["Benefit guardrails set for pilot program.", "Next finance sync scheduled for Friday."],
  },
  CFO: {
    metrics: [
      { label: "Run-rate Savings", value: "$18.4M", delta: "+$2.1M" },
      { label: "Investment Remaining", value: "$6.3M" },
      { label: "Payback Status", value: "Ahead by 2 months" },
    ],
    highlights: ["Sequencer wave 1 is cleared for funding.", "Two compliance risks require acknowledgement."],
  },
  CIO: {
    metrics: [
      { label: "Modernization Progress", value: "64%", delta: "+9%" },
      { label: "Critical Incidents", value: "0", delta: "-1" },
      { label: "Cloud Coverage", value: "78%" },
    ],
    highlights: [
      "Digital enterprise coverage expanded to Logistics in the last sprint.",
      "Architect and FP&A tracks remain aligned on this roadmap.",
    ],
  },
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") as ModeKey) ?? "Architect";
  const projectId = url.searchParams.get("projectId") ?? "demo";
  const summary = MODE_SUMMARIES[mode] ?? MODE_SUMMARIES.Architect;

  return NextResponse.json({
    ok: true,
    projectId,
    mode,
    metrics: summary.metrics,
    highlights: summary.highlights,
  });
}
