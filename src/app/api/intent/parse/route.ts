import { NextResponse } from "next/server";
import path from "node:path";
import { appendFile, mkdir } from "node:fs/promises";
import type { IntentEventOMS } from "@/lib/sequencer/types";

const REGION_ALIASES: Array<{ match: RegExp; value: string }> = [
  { match: /\bcanada\b/i, value: "Canada" },
  { match: /\bna\b|\bnorth america\b/i, value: "NA" },
  { match: /\bemea\b|\beurope\b/i, value: "EMEA" },
  { match: /\bapac\b|\basia\b/i, value: "APAC" },
  { match: /\bglobal\b/i, value: "Global" },
];

const CHANNEL_ALIAS_MAP: Record<string, string> = {
  b2b: "b2b",
  "b2c": "b2c",
  retail: "retail",
  stores: "retail",
  commerce: "b2c",
};

const PHASE_TIMELINE_MAP: Record<string, string> = {
  "1": "fy26",
  "2": "fy27",
  "3": "fy28",
};

const LOG_PATH = path.join(process.cwd(), ".fuxi", "logs", "intent_oms_pilot.ndjson");

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const command = typeof payload?.command === "string" ? payload.command.trim() : "";
  if (!command) {
    return NextResponse.json({ error: "Command is required" }, { status: 400 });
  }

  try {
    const event = parseIntentCommand(command);
    await logIntent(command, event);
    return NextResponse.json({ event });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Unable to parse intent" }, { status: 422 });
  }
}

function parseIntentCommand(command: string): IntentEventOMS {
  const withoutPrefix = command.replace(/^\/?intent\s*/i, "").trim();
  const normalized = withoutPrefix.toLowerCase();

  const region = detectRegion(normalized);
  const channels = detectChannels(normalized);
  const { timeline, phase } = detectPhaseAndTimeline(normalized);
  const actionInfo = detectAction(command, normalized);

  if (!withoutPrefix) throw new Error("No intent instructions provided");

  return {
    type: "intent:oms-sequence",
    payload: {
      region,
      phase,
      channels,
      timeline,
      action: actionInfo?.action,
      target: actionInfo?.target,
    },
  };
}

function detectRegion(text: string): string {
  for (const entry of REGION_ALIASES) {
    if (entry.match.test(text)) return entry.value;
  }
  return "Canada";
}

function detectChannels(text: string): string[] {
  const set = new Set<string>();
  for (const [alias, canonical] of Object.entries(CHANNEL_ALIAS_MAP)) {
    if (text.includes(alias)) set.add(canonical);
  }
  if (!set.size) {
    set.add("b2b");
    set.add("b2c");
  }
  return Array.from(set);
}

function detectPhaseAndTimeline(text: string): { phase: string; timeline: string } {
  const timelineMatch = text.match(/fy\s?(\d{2})/i);
  const phaseMatch = text.match(/phase\s*(\d+)/i);
  const timeline = timelineMatch ? `fy${timelineMatch[1]}`.toLowerCase() : phaseMatch ? PHASE_TIMELINE_MAP[phaseMatch[1]] : undefined;
  const resolvedTimeline = timeline ?? "fy26";
  return {
    phase: resolvedTimeline,
    timeline: resolvedTimeline,
  };
}

function detectAction(rawCommand: string, normalized: string):
  | { action: IntentEventOMS["payload"]["action"]; target?: string }
  | undefined {
  const match = rawCommand.match(/(decouple|remove|drop)\s+([A-Za-z0-9/&\-\s]+)/i);
  if (match) {
    const target = match[2].split(/[,.;]/)[0]?.trim();
    if (target) {
      return {
        action: "decouple",
        target,
      };
    }
  }
  if (normalized.includes("prioritize")) {
    return { action: "prioritize" };
  }
  if (normalized.includes("focus")) {
    return { action: "focus" };
  }
  return undefined;
}

async function logIntent(command: string, event: IntentEventOMS) {
  try {
    await mkdir(path.dirname(LOG_PATH), { recursive: true });
    const entry = { ts: new Date().toISOString(), command, event };
    await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`);
  } catch (error) {
    console.warn("Unable to persist intent log", error);
  }
}
