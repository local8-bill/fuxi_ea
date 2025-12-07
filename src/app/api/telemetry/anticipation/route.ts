import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const EVENTS_FILE = path.join(process.cwd(), ".fuxi", "data", "telemetry_events.ndjson");

type Bucket = {
  anticipations: number;
  accepted: number;
  dismissed: number;
  timeSum: number;
  timeCount: number;
};

function ensureBucket(map: Map<string, Bucket>, key: string) {
  if (!map.has(key)) {
    map.set(key, { anticipations: 0, accepted: 0, dismissed: 0, timeSum: 0, timeCount: 0 });
  }
  return map.get(key)!;
}

export async function GET() {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8").catch(() => "");
    if (!raw.trim()) {
      return NextResponse.json({
        ok: true,
        totals: { anticipations: 0, accepted: 0, dismissed: 0, acceptanceRate: 0, avgTimeToActionMs: null },
        byView: [],
      });
    }

    const totals: Bucket = { anticipations: 0, accepted: 0, dismissed: 0, timeSum: 0, timeCount: 0 };
    const byView = new Map<string, Bucket>();

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event: any;
      try {
        event = JSON.parse(trimmed);
      } catch {
        continue;
      }
      if (event.workspace_id && event.workspace_id !== "uxshell") continue;
      const view =
        event.data?.target_view ||
        event.data?.targetView ||
        event.target_view ||
        event.targetView ||
        "unknown";
      const bucket = ensureBucket(byView, view);
      switch (event.event_type) {
        case "anticipation_triggered":
          totals.anticipations += 1;
          bucket.anticipations += 1;
          break;
        case "next_step_accepted": {
          totals.accepted += 1;
          bucket.accepted += 1;
          const time = typeof event.time_to_action === "number" ? event.time_to_action : undefined;
          if (typeof time === "number" && Number.isFinite(time)) {
            totals.timeSum += time;
            totals.timeCount += 1;
            bucket.timeSum += time;
            bucket.timeCount += 1;
          }
          break;
        }
        case "preview_dismissed": {
          totals.dismissed += 1;
          bucket.dismissed += 1;
          const time = typeof event.time_to_action === "number" ? event.time_to_action : undefined;
          if (typeof time === "number" && Number.isFinite(time)) {
            totals.timeSum += time;
            totals.timeCount += 1;
            bucket.timeSum += time;
            bucket.timeCount += 1;
          }
          break;
        }
        default:
          break;
      }
    }

    const formatBucket = (view: string, bucket: Bucket) => ({
      view,
      anticipations: bucket.anticipations,
      accepted: bucket.accepted,
      dismissed: bucket.dismissed,
      acceptanceRate: bucket.anticipations ? bucket.accepted / bucket.anticipations : 0,
      avgTimeToActionMs: bucket.timeCount ? Math.round(bucket.timeSum / bucket.timeCount) : null,
    });

    const response = {
      ok: true,
      totals: {
        anticipations: totals.anticipations,
        accepted: totals.accepted,
        dismissed: totals.dismissed,
        acceptanceRate: totals.anticipations ? totals.accepted / totals.anticipations : 0,
        avgTimeToActionMs: totals.timeCount ? Math.round(totals.timeSum / totals.timeCount) : null,
      },
      byView: Array.from(byView.entries()).map(([view, bucket]) => formatBucket(view, bucket)),
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[TELEMETRY] Failed to summarize anticipatory events", err);
    return NextResponse.json({ ok: false, error: "Failed to summarize telemetry" }, { status: 500 });
  }
}
