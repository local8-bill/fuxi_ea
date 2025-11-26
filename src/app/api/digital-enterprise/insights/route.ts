import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Read-only access to local insights data files, if present.
 * Falls back to an empty payload when no file is available.
 */
export async function GET() {
  const candidates = [
    path.join(process.cwd(), ".fuxi", "data", "insights", "ai_insights.json"),
    path.join(process.cwd(), ".fuxi", "data", "digital-enterprise", "insights.json"),
  ];

  for (const filePath of candidates) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const json = JSON.parse(raw);
      return NextResponse.json(json);
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        console.error("[INSIGHTS-API] Failed to read", filePath, err);
      }
    }
  }

  return NextResponse.json({ nodes: [] });
}
