import fs from "node:fs/promises";
import path from "node:path";

export type HomeSessionState = {
  projectId: string;
  lastStage?: string | null;
  lastIntent?: string | null;
  lastSeen?: string | null;
  firstTime?: boolean;
};

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SESSION_FILE = path.join(DATA_ROOT, "sessions", "home.json");

export async function readHomeSession(): Promise<HomeSessionState> {
  try {
    const raw = await fs.readFile(SESSION_FILE, "utf8");
    const data = JSON.parse(raw) as HomeSessionState;
    return {
      projectId: data.projectId ?? "700am",
      lastStage: data.lastStage ?? null,
      lastIntent: data.lastIntent ?? null,
      lastSeen: data.lastSeen ?? null,
      firstTime: data.firstTime ?? false,
    };
  } catch {
    return { projectId: "700am", firstTime: true };
  }
}

export async function writeHomeSession(partial: Partial<HomeSessionState> & { projectId?: string }) {
  const next = await readHomeSession();
  const merged: HomeSessionState = {
    ...next,
    ...partial,
    projectId: partial.projectId ?? next.projectId ?? "700am",
    firstTime: partial.firstTime ?? next.firstTime ?? false,
    lastSeen: partial.lastSeen ?? next.lastSeen ?? new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(SESSION_FILE), { recursive: true });
  await fs.writeFile(SESSION_FILE, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}
