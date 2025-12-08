"use server";

import fs from "node:fs/promises";
import path from "node:path";

const learningDir = path.join(process.cwd(), "data", "learning");
const learningLog = path.join(learningDir, "intent_feedback.ndjson");

async function ensureLearningStore() {
  await fs.mkdir(learningDir, { recursive: true });
  try {
    await fs.access(learningLog);
  } catch {
    await fs.writeFile(learningLog, "", "utf8");
  }
}

export type IntentFeedbackEvent = Record<string, unknown>;

export async function recordIntentFeedback(event: IntentFeedbackEvent) {
  await ensureLearningStore();
  const payload = { ...event, timestamp: new Date().toISOString() };
  await fs.appendFile(learningLog, `${JSON.stringify(payload)}\n`, "utf8");
}
