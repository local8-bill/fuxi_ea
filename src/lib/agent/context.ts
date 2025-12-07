import fs from "node:fs/promises";
import path from "node:path";
import type { AgentTelemetryEvent } from "@/types/agent";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const TELEMETRY_FILE = path.join(DATA_ROOT, "telemetry_events.ndjson");

export async function loadRecentTelemetry(limit = 6): Promise<AgentTelemetryEvent[]> {
  try {
    const raw = await fs.readFile(TELEMETRY_FILE, "utf8");
    const lines = raw
      .trim()
      .split("\n")
      .filter(Boolean);
    const recent = lines.slice(-limit).reverse();
    const events: AgentTelemetryEvent[] = [];
    recent.forEach((line) => {
      try {
        events.push(JSON.parse(line) as AgentTelemetryEvent);
      } catch {
        // ignore malformed telemetry
      }
    });
    return events;
  } catch {
    return [];
  }
}
