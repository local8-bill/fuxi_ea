import fs from "node:fs/promises";
import path from "node:path";
import { normalizeTelemetryPayload, type TelemetryEvent } from "./schema";

const DATA_DIR = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const EVENTS_FILE = path.join(DATA_DIR, "telemetry_events.ndjson");

/**
 * Server-side telemetry recorder that validates payloads and appends to the local NDJSON log.
 * Falls back to the telemetry API when invoked in a browser context.
 */
export async function recordTelemetry(event: Partial<TelemetryEvent>): Promise<TelemetryEvent | null> {
  let normalized: TelemetryEvent;
  try {
    normalized = normalizeTelemetryPayload(event);
  } catch (err) {
    console.warn("[telemetry] invalid payload", err);
    return null;
  }

  if (typeof window !== "undefined") {
    try {
      await fetch("/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
        keepalive: true,
      });
    } catch (err) {
      console.warn("[telemetry] browser record failed", err);
    }
    return normalized;
  }

  try {
    await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    await fs.appendFile(EVENTS_FILE, JSON.stringify(normalized) + "\n", "utf8");
    return normalized;
  } catch (err) {
    console.warn("[telemetry] failed to append event", err);
    return null;
  }
}
