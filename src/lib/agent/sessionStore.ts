import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AgentMessage, AgentSession } from "@/types/agent";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SESSION_DIR = path.join(DATA_ROOT, "sessions", "agent");
const MAX_MESSAGES = 50;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
}

export async function loadAgentSession(projectId: string): Promise<{ session: AgentSession; existing: boolean }> {
  await ensureDir(SESSION_DIR);
  const file = path.join(SESSION_DIR, `${projectId}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as AgentSession;
    const session: AgentSession = {
      projectId,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      memory: {
        focusAreas: parsed.memory?.focusAreas ?? [],
        lastIntent: parsed.memory?.lastIntent,
        lastView: parsed.memory?.lastView,
        lastMode: parsed.memory?.lastMode,
        toneProfile: parsed.memory?.toneProfile,
      },
    };
    return { session, existing: true };
  } catch {
    const fresh: AgentSession = {
      projectId,
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: randomUUID(),
          role: "assistant",
          content:
            "Let's focus the enterprise map. Which platforms are you assessing today? (ERP, CRM, Commerce, Data, Finance...)",
          ts: Date.now(),
        },
      ],
      memory: { focusAreas: [] },
    };
    return { session: fresh, existing: false };
  }
}

export async function saveAgentSession(session: AgentSession) {
  await ensureDir(SESSION_DIR);
  const file = path.join(SESSION_DIR, `${session.projectId}.json`);
  const trimmed = {
    ...session,
    messages: session.messages.slice(-MAX_MESSAGES),
    updatedAt: session.updatedAt ?? new Date().toISOString(),
  };
  await fs.writeFile(file, JSON.stringify(trimmed, null, 2), "utf8");
}

export function appendSessionMessage(session: AgentSession, message: Omit<AgentMessage, "id" | "ts"> & Partial<Pick<AgentMessage, "id" | "ts">>) {
  const entry: AgentMessage = {
    id: message.id ?? randomUUID(),
    ts: message.ts ?? Date.now(),
    role: message.role,
    content: message.content,
    intent: message.intent,
    action: message.action,
    card: message.card,
    link: message.link,
  };
  session.messages = [...session.messages, entry].slice(-MAX_MESSAGES);
  session.updatedAt = new Date().toISOString();
}
