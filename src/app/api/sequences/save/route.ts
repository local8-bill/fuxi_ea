"use server";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SEQUENCES_FILE = path.join(DATA_ROOT, "sequences.json");

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    await fs.mkdir(path.dirname(SEQUENCES_FILE), { recursive: true });
    let existing: any[] = [];
    try {
      const raw = await fs.readFile(SEQUENCES_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed;
      }
    } catch {
      existing = [];
    }
    existing.push({
      ...payload,
      saved_at: new Date().toISOString(),
    });
    await fs.writeFile(SEQUENCES_FILE, JSON.stringify(existing, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save sequence" }, { status: 500 });
  }
}
