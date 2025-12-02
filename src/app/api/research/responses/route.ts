import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const RESPONSES_DIR = path.join(process.cwd(), ".fuxi", "data", "research");
const RESPONSES_FILE = path.join(RESPONSES_DIR, "responses.json");

async function ensureFile() {
  await fs.mkdir(RESPONSES_DIR, { recursive: true });
  try {
    await fs.access(RESPONSES_FILE);
  } catch {
    await fs.writeFile(RESPONSES_FILE, JSON.stringify({ responses: [] }, null, 2), "utf8");
  }
}

export async function GET() {
  try {
    await ensureFile();
    const raw = await fs.readFile(RESPONSES_FILE, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch (err) {
    console.error("[RESEARCH] Failed to read responses", err);
    return NextResponse.json({ responses: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureFile();
    const body = await req.json();
    const raw = await fs.readFile(RESPONSES_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    const list: any[] = Array.isArray(parsed.responses) ? parsed.responses : [];
    const entry = {
      id: `resp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      payload: body,
    };
    list.push(entry);
    await fs.writeFile(RESPONSES_FILE, JSON.stringify({ responses: list }, null, 2), "utf8");
    return NextResponse.json({ ok: true, saved: entry.id });
  } catch (err) {
    console.error("[RESEARCH] Failed to save response", err);
    return NextResponse.json({ ok: false, error: "Failed to save response" }, { status: 500 });
  }
}
