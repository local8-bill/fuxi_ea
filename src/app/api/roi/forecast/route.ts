import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const CANDIDATES = [
  path.join(process.cwd(), ".fuxi", "data", "roi", "forecast.json"),
  path.join(process.cwd(), "tests", "results", "roi_forecast.sample.json"),
];

export async function GET() {
  for (const file of CANDIDATES) {
    try {
      const raw = await fs.readFile(file, "utf8");
      const json = JSON.parse(raw);
      return NextResponse.json(json);
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        console.error("[ROI-FORECAST] failed to read", file, err);
      }
    }
  }

  return NextResponse.json({
    timeline: [],
    events: [],
    predictions: { breakEvenMonth: null },
  });
}
