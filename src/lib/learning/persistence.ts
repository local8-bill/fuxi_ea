import fs from "node:fs/promises";
import path from "node:path";
import type { LearningMetrics } from "./types";

const learningDir = path.join(process.cwd(), "data", "learning");
const feedbackFile = path.join(learningDir, "intent_feedback.ndjson");
const memoryFile = path.join(learningDir, "memoryCache.json");
const telemetryDir = path.join(process.cwd(), ".fuxi", "data", "telemetry");
const adaptiveLogFile = path.join(telemetryDir, "adaptive.log");

export type LearningState = {
  completedWaves: number;
  totalWaves: number;
  metrics?: LearningMetrics;
  narrative?: string;
  updatedAt?: string;
};

type LearningStore = Record<string, LearningState>;

async function ensureLearningDir() {
  await fs.mkdir(learningDir, { recursive: true });
}

async function ensureTelemetryDir() {
  await fs.mkdir(telemetryDir, { recursive: true });
}

export async function appendLearningRecord(record: Record<string, unknown>) {
  await ensureLearningDir();
  await fs.appendFile(feedbackFile, `${JSON.stringify(record)}\n`, "utf8");
}

async function readLearningStore(): Promise<LearningStore> {
  try {
    const raw = await fs.readFile(memoryFile, "utf8");
    return JSON.parse(raw) as LearningStore;
  } catch {
    return {};
  }
}

async function writeLearningStore(store: LearningStore) {
  await ensureLearningDir();
  await fs.writeFile(memoryFile, JSON.stringify(store, null, 2), "utf8");
}

export async function getLearningState(projectId: string): Promise<LearningState | null> {
  const store = await readLearningStore();
  return store[projectId] ?? null;
}

export async function saveLearningState(projectId: string, state: LearningState) {
  const store = await readLearningStore();
  store[projectId] = state;
  await writeLearningStore(store);
}

export async function updateProgressState(
  projectId: string,
  event: { wave?: number; totalWaves?: number; type?: string },
): Promise<LearningState> {
  const current = (await getLearningState(projectId)) ?? { completedWaves: 0, totalWaves: 3 };
  const next: LearningState = {
    ...current,
    completedWaves: current.completedWaves ?? 0,
    totalWaves: current.totalWaves ?? 3,
  };
  if (typeof event.totalWaves === "number" && event.totalWaves > 0) {
    next.totalWaves = Math.max(event.totalWaves, next.totalWaves ?? event.totalWaves);
  }
  if (typeof event.wave === "number" && event.type === "sequencer_action_confirmed") {
    next.completedWaves = Math.max(event.wave, next.completedWaves ?? 0);
  }
  await saveLearningState(projectId, next);
  return next;
}

export async function logAdaptiveEvent(message: string, payload?: Record<string, unknown>) {
  await ensureTelemetryDir();
  const line = JSON.stringify({ ts: new Date().toISOString(), message, payload }) + "\n";
  await fs.appendFile(adaptiveLogFile, line, "utf8");
}
