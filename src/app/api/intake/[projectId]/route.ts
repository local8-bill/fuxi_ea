"use server";

import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), ".fuxi", "data");
const INTAKE_FILE = path.join(DATA_DIR, "intake.json");

async function readAll() {
  const raw = await fs.readFile(INTAKE_FILE, "utf8").catch(() => "{}");
  return JSON.parse(raw);
}

async function writeAll(data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(INTAKE_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const projectId = params?.projectId;
  if (!projectId) return NextResponse.json({ ok: false, error: "missing_project" }, { status: 400 });
  const all = await readAll();
  const entry = all[projectId];
  return NextResponse.json({ ok: true, intake: entry ?? null });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const projectId = params?.projectId;
  if (!projectId) return NextResponse.json({ ok: false, error: "missing_project" }, { status: 400 });
  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const all = await readAll();
  all[projectId] = {
    projectId,
    industry: body.industry ?? null,
    drivers: Array.isArray(body.drivers) ? body.drivers : [],
    aggression: body.aggression ?? null,
    constraints: Array.isArray(body.constraints) ? body.constraints : [],
    untouchables: Array.isArray(body.untouchables) ? body.untouchables : [],
    notes: body.notes ?? null,
    updated_at: new Date().toISOString(),
  };
  await writeAll(all);
  return NextResponse.json({ ok: true });
}
