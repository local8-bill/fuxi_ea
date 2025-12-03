import { NextRequest, NextResponse } from "next/server";
import { forecastByDomain } from "@/domain/services/roi";
import { recordTelemetry } from "@/lib/telemetry/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type TestStage = { month: number; cost: number; benefit: number };
type TestDataset = {
  stages: TestStage[];
  domains?: Record<string, { impact?: number; complexity?: number }>;
};

async function loadTestDatasets(): Promise<Record<string, TestDataset>> {
  const file = path.join(process.cwd(), "docs", "test_dataset", "roi_test_datasets.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function buildForecastFromTest(dataset: TestDataset) {
  const stages = [...dataset.stages].sort((a, b) => a.month - b.month);
  const timeline = stages.map((s) => ({
    month: s.month,
    cost: s.cost,
    benefit: s.benefit,
    roi: s.cost === 0 ? 0 : (s.benefit - s.cost) / s.cost,
  }));

  let breakEvenMonth: number | null = null;
  let netROI: number | null = null;
  if (timeline.length) {
    const cum = timeline.reduce(
      (acc, cur, idx) => {
        acc.cost += cur.cost;
        acc.benefit += cur.benefit;
        if (breakEvenMonth === null && acc.benefit >= acc.cost) {
          breakEvenMonth = cur.month;
        }
        if (idx === timeline.length - 1 && acc.cost > 0) {
          netROI = Number(((acc.benefit - acc.cost) / acc.cost).toFixed(3));
        }
        return acc;
      },
      { cost: 0, benefit: 0 },
    );
    if (netROI === null && cum.cost > 0) {
      netROI = Number(((cum.benefit - cum.cost) / cum.cost).toFixed(3));
    }
  }

  const domains: any[] = [];
  if (dataset.domains) {
    Object.entries(dataset.domains).forEach(([domain, meta]) => {
      const impact = meta.impact ?? 1;
      const complexity = meta.complexity ?? 1;
      const months = stages.map((s) => s.month);
      const cost = stages.map((s) => Math.round(s.cost * complexity));
      const benefit = stages.map((s) => Math.round(s.benefit * impact));

      let domBreak: number | null = null;
      let cumCost = 0;
      let cumBenefit = 0;
      cost.forEach((c, idx) => {
        cumCost += c;
        cumBenefit += benefit[idx] ?? 0;
        if (domBreak === null && cumBenefit >= cumCost) {
          domBreak = months[idx];
        }
      });

      const roi = cost.map((c, idx) => {
        const b = benefit[idx] ?? 0;
        return c === 0 ? 0 : Number(((b - c) / c).toFixed(3));
      });

      domains.push({ domain, months, cost, benefit, roi, breakEvenMonth: domBreak });
    });
  }

  return {
    timeline,
    domains,
    predictions: { breakEvenMonth, netROI },
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectParam = url.searchParams.get("project") ?? undefined;
    const tests = await loadTestDatasets();

    const useTest =
      projectParam && Object.prototype.hasOwnProperty.call(tests, projectParam)
        ? buildForecastFromTest(tests[projectParam] as TestDataset)
        : null;

    const forecast = useTest ?? (await forecastByDomain(5));

    // Emit telemetry
    await recordTelemetry({
      event_type: "roi_forecast_generated",
      workspace_id: "roi_dashboard",
      data: {
        domains: forecast.domains.length,
        breakEvenMonth: forecast.predictions.breakEvenMonth,
      },
    });

    for (const d of forecast.domains) {
      await recordTelemetry({
        event_type: "roi_stage_calculated",
        workspace_id: "roi_dashboard",
        data: {
          domain: d.domain,
          breakEvenMonth: d.breakEvenMonth,
        },
      });
    }

    return NextResponse.json(forecast);
  } catch (err: any) {
    console.error("[ROI-FORECAST] failed", err);
    return NextResponse.json(
      {
        error: "failed_to_generate_forecast",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
