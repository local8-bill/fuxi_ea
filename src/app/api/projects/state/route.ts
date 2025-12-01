import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId") ?? "";
    if (!projectId) return NextResponse.json({ ok: false, error: "Missing projectId" }, { status: 400 });
    const file = path.join(PROJECTS_ROOT, projectId, "project.json");
    const raw = await fs.readFile(file, "utf8");
    const state = JSON.parse(raw);
    return NextResponse.json({ ok: true, state });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
}
