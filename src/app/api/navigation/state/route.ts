import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".fuxi", "data");
const DATA_FILE = path.join(DATA_DIR, "nav_state.json");

type ViewKey = "graph" | "roi" | "sequencer" | "review" | "digital";
type ModeKey = "Architect" | "Analyst" | "FP&A" | "CFO" | "CIO";

type NavStateEntry = {
  lastView?: ViewKey | null;
  lastMode?: ModeKey | null;
  updatedAt: string;
};

type NavStateStore = Record<string, NavStateEntry>;

async function readStore(): Promise<NavStateStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as NavStateStore;
  } catch {
    return {};
  }
}

async function writeStore(store: NavStateStore) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ ok: false, error: "projectId is required" }, { status: 400 });
  }
  const store = await readStore();
  return NextResponse.json({ ok: true, state: store[projectId] ?? null });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      projectId?: string;
      lastView?: ViewKey | null;
      lastMode?: ModeKey | null;
    };
    if (!body?.projectId) {
      return NextResponse.json({ ok: false, error: "projectId is required" }, { status: 400 });
    }
    const store = await readStore();
    const existing = store[body.projectId] ?? { updatedAt: new Date().toISOString() };
    const next: NavStateEntry = {
      lastView: body.lastView ?? existing.lastView ?? null,
      lastMode: body.lastMode ?? existing.lastMode ?? null,
      updatedAt: new Date().toISOString(),
    };
    store[body.projectId] = next;
    await writeStore(store);
    return NextResponse.json({ ok: true, state: next });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "invalid payload" }, { status: 400 });
  }
}
