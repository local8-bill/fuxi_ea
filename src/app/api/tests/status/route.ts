import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const RESULTS_PATH = path.join(process.cwd(), ".fuxi", "tests", "results.json");

export async function GET() {
  try {
    let summary = {
      testsTotal: 0,
      testsPassing: 0,
      lastRun: null as string | null,
      suites: [] as { suite: string; status: string; runAt?: string }[],
    };

    try {
      const raw = await fs.readFile(RESULTS_PATH, "utf8");
      const parsed = JSON.parse(raw);
      summary.testsTotal = parsed.testsTotal ?? 0;
      summary.testsPassing = parsed.testsPassing ?? 0;
      summary.lastRun = parsed.lastRun ?? null;
      summary.suites = parsed.suites ?? [];
    } catch {
      // fallback stub when no results exist
      summary = {
        testsTotal: 0,
        testsPassing: 0,
        lastRun: null,
        suites: [],
      };
    }

    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("tests/status error", err);
    return NextResponse.json({ ok: false, error: "Failed to load test status" }, { status: 500 });
  }
}
