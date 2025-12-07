import fs from "node:fs/promises";
import path from "node:path";
import type { TelemetryEvent } from "./schema";

const DATA_DIR = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const TELEMETRY_DIR = path.join(DATA_DIR, "telemetry");
const TONE_LOG = path.join(TELEMETRY_DIR, "tone_behavior.log");
const TONE_PERF_FILE = path.join(TELEMETRY_DIR, "tone_performance.json");
const CONVERSATION_FILE = path.join(TELEMETRY_DIR, "conversation_behavior.json");

const TONE_EVENTS = new Set(["tone_profile_change", "conversation_intent", "speech_delay_applied"]);

type TonePerformance = {
  totalMessages: number;
  toneCounts: Record<string, number>;
  toneStabilityIndex: number;
  pacingSamples: number;
  avgDelayMs: number;
  pacingVariance: number;
  delayMean: number;
  delayM2: number;
  lastUpdated: string;
};

const defaultTonePerformance = (): TonePerformance => ({
  totalMessages: 0,
  toneCounts: { formal: 0, neutral: 0, concise: 0 },
  toneStabilityIndex: 0,
  pacingSamples: 0,
  avgDelayMs: 0,
  pacingVariance: 0,
  delayMean: 0,
  delayM2: 0,
  lastUpdated: new Date().toISOString(),
});

type ConversationBehavior = {
  intentCounts: Record<string, number>;
  focusTrend: Record<string, number>;
  lastUpdated: string;
};

const defaultConversationBehavior = (): ConversationBehavior => ({
  intentCounts: {},
  focusTrend: {},
  lastUpdated: new Date().toISOString(),
});

async function appendLog(file: string, payload: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(payload) + "\n", "utf8");
}

async function readJson<T>(file: string, fallback: () => T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

export async function readTonePerformance() {
  return readJson(TONE_PERF_FILE, defaultTonePerformance);
}

export async function readConversationBehavior() {
  return readJson(CONVERSATION_FILE, defaultConversationBehavior);
}

function coerceData(event: TelemetryEvent): Record<string, any> {
  if (event.data && typeof event.data === "object") return event.data;
  return {};
}

export async function updateDemoTelemetry(event: TelemetryEvent) {
  if (!TONE_EVENTS.has(event.event_type)) return;
  await appendLog(TONE_LOG, event);

  const data = coerceData(event);

  if (event.event_type === "conversation_intent" || event.event_type === "speech_delay_applied") {
    const perf = await readJson(TONE_PERF_FILE, defaultTonePerformance);
    if (event.event_type === "conversation_intent") {
      perf.totalMessages += 1;
      const tone = typeof data.tone === "string" ? data.tone : undefined;
      if (tone && perf.toneCounts[tone] != null) {
        perf.toneCounts[tone] += 1;
      }
      const counts = Object.values(perf.toneCounts);
      const maxCount = counts.length ? Math.max(...counts) : 0;
      perf.toneStabilityIndex = perf.totalMessages > 0 ? maxCount / perf.totalMessages : 0;
    }
    if (event.event_type === "speech_delay_applied") {
      const delay = typeof data.delayMs === "number" ? data.delayMs : undefined;
      if (typeof delay === "number") {
        perf.pacingSamples += 1;
        const delta = delay - perf.delayMean;
        perf.delayMean += delta / perf.pacingSamples;
        const delta2 = delay - perf.delayMean;
        perf.delayM2 += delta * delta2;
        perf.avgDelayMs = perf.delayMean;
        perf.pacingVariance = perf.pacingSamples > 1 ? perf.delayM2 / (perf.pacingSamples - 1) : 0;
      }
    }
    perf.lastUpdated = new Date().toISOString();
    await fs.writeFile(TONE_PERF_FILE, JSON.stringify(perf, null, 2), "utf8");
  }

  if (event.event_type === "conversation_intent") {
    const convo = await readJson(CONVERSATION_FILE, defaultConversationBehavior);
    const intent = typeof data.intent === "string" ? data.intent : event.event_type;
    convo.intentCounts[intent] = (convo.intentCounts[intent] ?? 0) + 1;
    const focus = data.focus;
    const applyFocus = (value: string) => {
      if (!value) return;
      convo.focusTrend[value] = (convo.focusTrend[value] ?? 0) + 1;
    };
    if (Array.isArray(focus)) {
      focus.forEach((entry) => {
        if (typeof entry === "string") applyFocus(entry);
      });
    } else if (typeof focus === "string") {
      applyFocus(focus);
    }
    convo.lastUpdated = new Date().toISOString();
    await fs.writeFile(CONVERSATION_FILE, JSON.stringify(convo, null, 2), "utf8");
  }
}
