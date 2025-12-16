import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SNAPSHOT_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

export const runtime = "nodejs";

export async function GET() {
  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, "utf8");
    const json = JSON.parse(raw);
    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    const status = err?.code === "ENOENT" ? 404 : 500;
    return NextResponse.json({ ok: false, error: "Snapshot unavailable" }, { status });
  }
}
