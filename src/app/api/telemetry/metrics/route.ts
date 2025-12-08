import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), ".fuxi", "data");
const EVENTS_FILE = path.join(DATA_DIR, "telemetry_events.ndjson");

type SceneAggregate = {
  views: number;
  totalMs: number;
};

type DecisionAggregate = Record<string, number>;

export async function GET() {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8").catch(() => "");
    const lines = raw.trim() ? raw.trim().split("\n").filter(Boolean) : [];
    const sectionTotals: Record<string, SceneAggregate> = {};
    let sent = 0;
    let received = 0;
    let trustSignals = 0;
    let decisionTotal = 0;
    const decisionsByScene: DecisionAggregate = {};
    let pulseTotal = 0;
    const pulseByStep: Record<string, number> = {};

    for (const line of lines) {
      let event: any;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      const type = event?.event_type;
      const data = (event?.data ?? {}) as Record<string, any>;
      switch (type) {
        case "scene_viewed": {
          const scene = String(data.scene ?? "unknown");
          const agg = sectionTotals[scene] || { views: 0, totalMs: 0 };
          agg.views += 1;
          sectionTotals[scene] = agg;
          break;
        }
        case "scene_view_time": {
          const scene = String(data.scene ?? "unknown");
          const agg = sectionTotals[scene] || { views: 0, totalMs: 0 };
          const duration = typeof data.duration_ms === "number" ? data.duration_ms : typeof data.durationMs === "number" ? data.durationMs : 0;
          agg.totalMs += duration;
          sectionTotals[scene] = agg;
          break;
        }
        case "agent_message_sent": {
          sent += 1;
          break;
        }
        case "agent_message_received": {
          received += 1;
          break;
        }
        case "decision_taken": {
          decisionTotal += 1;
          const scene = String(data.scene ?? "unknown");
          decisionsByScene[scene] = (decisionsByScene[scene] ?? 0) + 1;
          break;
        }
        case "ai_trust_signal": {
          trustSignals += 1;
          break;
        }
        case "pulse_state_change": {
          pulseTotal += 1;
          const step = String(data.to ?? data.step ?? "unknown");
          pulseByStep[step] = (pulseByStep[step] ?? 0) + 1;
          break;
        }
        default:
          break;
      }
    }

    const navigation = Object.entries(sectionTotals).map(([scene, agg]) => ({
      scene,
      views: agg.views,
      avg_ms: agg.views ? Math.round(agg.totalMs / agg.views) : 0,
      total_ms: agg.totalMs,
    }));

    const conversation = {
      sent,
      received,
      depth_ratio: sent ? Number((received / sent).toFixed(2)) : 0,
    };

    const decisions = {
      total: decisionTotal,
      by_scene: decisionsByScene,
    };

    const aiTrust = {
      signals: trustSignals,
      prompts: sent,
      index: sent ? Number(Math.min(1, trustSignals / sent).toFixed(2)) : 0,
    };

    const pulse = {
      total: pulseTotal,
      by_step: pulseByStep,
    };

    return NextResponse.json({ ok: true, navigation, conversation, decisions, aiTrust, pulse });
  } catch (err: any) {
    console.error("[TELEMETRY] metrics failure", err);
    return NextResponse.json({ ok: false, error: "Failed to compute telemetry metrics" }, { status: 500 });
  }
}
