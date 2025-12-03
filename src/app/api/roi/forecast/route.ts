import { NextResponse } from "next/server";
import { forecastByDomain } from "@/domain/services/roi";
import { recordTelemetry } from "@/lib/telemetry/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const forecast = await forecastByDomain(5);

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
