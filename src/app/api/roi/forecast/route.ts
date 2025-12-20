import { NextRequest, NextResponse } from "next/server";
import { computeTccBreakdown, forecastByDomain } from "@/domain/services/roi";
import { buildFinancialForecast, enrichForecast } from "@/domain/services/financials";
import { recordTelemetry } from "@/lib/telemetry/server";
import { listRoiAssumptions, listRoiTargets } from "@/lib/roi/storage";
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
  let totalCost = 0;
  let totalBenefit = 0;
  if (timeline.length) {
    const cum = timeline.reduce(
      (acc, cur, idx) => {
        acc.cost += cur.cost;
        acc.benefit += cur.benefit;
        if (breakEvenMonth === null && acc.benefit >= acc.cost) {
          breakEvenMonth = cur.month;
        }
        if (idx === timeline.length - 1) {
          totalCost = acc.cost;
          totalBenefit = acc.benefit;
          if (acc.cost > 0) {
            netROI = Number(((acc.benefit - acc.cost) / acc.cost).toFixed(3));
          }
        }
        return acc;
      },
      { cost: 0, benefit: 0 },
    );
    if (netROI === null && totalCost > 0) {
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

      const projectCost = cost.reduce((s, v) => s + v, 0);
      const tcc = computeTccBreakdown(projectCost, domain);
      domains.push({ domain, months, cost, benefit, roi, breakEvenMonth: domBreak, tcc });
    });
  }

  const tcc = computeTccBreakdown(totalCost, "test_dataset");

  return {
    timeline,
    domains,
    predictions: {
      breakEvenMonth,
      netROI,
      totalCost,
      totalBenefit,
      tccTotal: tcc.total,
      tccRatio: tcc.ratio,
      tccClassification: tcc.classification,
      tccBreakdown: tcc,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectParam = url.searchParams.get("project") ?? undefined;
    const sequenceParam = url.searchParams.get("sequence") ?? undefined;
    const tests = await loadTestDatasets();

    const useTest =
      projectParam && Object.prototype.hasOwnProperty.call(tests, projectParam)
        ? buildForecastFromTest(tests[projectParam] as TestDataset)
        : null;

    const [targets, assumptions] = await Promise.all([
      listRoiTargets(projectParam),
      listRoiAssumptions(projectParam),
    ]);
    const targetsForSequence = sequenceParam
      ? targets.filter((entry) => entry.sequenceId === sequenceParam)
      : targets;
    const assumptionsForSequence = sequenceParam
      ? assumptions.filter((entry) => entry.sequenceId === sequenceParam)
      : assumptions;
    const latestTarget = targetsForSequence.at(-1) ?? null;
    const latestAssumptions = assumptionsForSequence.at(-1) ?? null;

    const forecast = useTest ? enrichForecast(useTest) : await buildFinancialForecast(projectParam ?? undefined);

    // Emit telemetry
    await recordTelemetry({
      event_type: "roi_forecast_generated",
      workspace_id: "roi_dashboard",
      data: {
        domains: forecast.domains.length,
        breakEvenMonth: forecast.predictions.breakEvenMonth,
      },
    });

    await recordTelemetry({
      event_type: "tcc_computed",
      workspace_id: "roi_dashboard",
      data: {
        tccTotal: forecast.predictions.tccTotal,
        tccRatio: forecast.predictions.tccRatio,
        classification: forecast.predictions.tccClassification,
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

      if (d.tcc) {
        await recordTelemetry({
          event_type: "tcc_computed",
          workspace_id: "roi_dashboard",
          data: {
            domain: d.domain,
            tccTotal: d.tcc.total,
            tccRatio: d.tcc.ratio,
            classification: d.tcc.classification,
          },
        });
      }
    }

    return NextResponse.json({
      ...forecast,
      targets: latestTarget,
      assumptions: latestAssumptions,
    });
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
