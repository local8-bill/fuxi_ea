import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import type { IntentEventOMS } from "@/lib/sequencer/types";

export const runtime = "nodejs";

const REGION_TOKENS: Record<string, string> = {
  canada: "Canada",
  na: "North America",
  emea: "EMEA",
  apac: "APAC",
  global: "Global",
};

const CHANNEL_TOKENS: Record<string, string[]> = {
  b2b: ["b2b", "business to business"],
  b2c: ["b2c", "business to consumer"],
  retail: ["retail", "store", "stores"],
};

const ACTION_TOKENS: Record<string, IntentEventOMS["payload"]["action"]> = {
  decouple: "decouple",
  remove: "decouple",
  drop: "decouple",
  prioritize: "prioritize",
  focus: "focus",
};

const BACKUP_LOG = "/tmp/intent_oms_pilot.log";

export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();
    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "command is required" }, { status: 400 });
    }

    const normalized = command.replace(/^\/intent/i, "").trim().toLowerCase();
    if (!normalized) {
      return NextResponse.json({ error: "command is required" }, { status: 400 });
    }

    const region = detectRegion(normalized);
    const { phase, timeline } = detectPhase(normalized);
    const channels = detectChannels(normalized);
    const { action, target } = detectAction(normalized);

    const event: IntentEventOMS = {
      type: "intent:oms-sequence",
      payload: {
        region,
        phase,
        channels,
        action,
        target,
        timeline,
      },
    };

    await appendLog(command, event);

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error("[/api/intent/parse] error", error);
    return NextResponse.json({ error: error?.message ?? "Unexpected error" }, { status: 500 });
  }
}

function detectRegion(text: string) {
  for (const [token, label] of Object.entries(REGION_TOKENS)) {
    if (text.includes(token)) return label;
  }
  return "Global";
}

function detectPhase(text: string) {
  const phaseMatch = text.match(/phase\s*(\d)/);
  if (phaseMatch) {
    const phase = `Phase ${phaseMatch[1]}`;
    return { phase, timeline: phase.toLowerCase() };
  }

  const fyMatch = text.match(/fy(\d{2})/);
  if (fyMatch) {
    const year = `FY${fyMatch[1]}`;
    return { phase: year.toLowerCase(), timeline: year };
  }

  return { phase: "phase 1", timeline: "phase 1" };
}

function detectChannels(text: string) {
  const detected = new Set<string>();
  for (const [channel, tokens] of Object.entries(CHANNEL_TOKENS)) {
    if (tokens.some((token) => text.includes(token))) detected.add(channel);
  }

  if (!detected.size) {
    const withMatch = text.match(/with\s+([a-z0-9+\s]+)/);
    if (withMatch) {
      withMatch[1]
        .split(/[+,&]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          if (part === "b2b" || part === "b2c") detected.add(part);
        });
    }
  }

  return detected.size ? Array.from(detected) : ["b2b"];
}

function detectAction(text: string) {
  for (const [token, action] of Object.entries(ACTION_TOKENS)) {
    const index = text.indexOf(token);
    if (index === -1) continue;
    const remainder = text.slice(index + token.length).trim();
    const target = remainder.split(/[\s,]/).filter(Boolean)[0];
    return { action, target: target ? target.toUpperCase() : undefined };
  }
  return { action: undefined, target: undefined };
}

async function appendLog(command: string, event: IntentEventOMS) {
  try {
    const line = JSON.stringify({ command, event, timestamp: new Date().toISOString() });
    await fs.appendFile(BACKUP_LOG, `${line}\n`);
  } catch (error) {
    // fallback: try writing to project tmp folder if /tmp unavailable
    try {
      const fallback = path.resolve(process.cwd(), ".tmp", "intent_oms_pilot.log");
      await fs.mkdir(path.dirname(fallback), { recursive: true });
      await fs.appendFile(fallback, `${new Date().toISOString()} ${command}\n`);
    } catch {
      // silently ignore logging failures
    }
  }
}
