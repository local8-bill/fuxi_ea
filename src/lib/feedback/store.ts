import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const FEEDBACK_FILE = path.join(DATA_ROOT, "feedback.ndjson");

export type FeedbackEntry = {
  user_id: string;
  project_id: string;
  scene?: string;
  message: string;
  timestamp?: string;
};

export async function appendFeedback(entry: FeedbackEntry) {
  const payload = {
    ...entry,
    timestamp: entry.timestamp ?? new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
  await fs.appendFile(FEEDBACK_FILE, JSON.stringify(payload) + "\n", "utf8");
  return payload;
}
