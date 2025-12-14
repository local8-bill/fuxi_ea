"use server";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspace = searchParams.get("workspace") ?? "digital_enterprise";
  const project = searchParams.get("project") ?? "default";

  const contextFilename = `${workspace}_${project}_context.json`;
  const contextPath = path.join(DATA_ROOT, "ale", contextFilename);

  try {
    const raw = await fs.readFile(contextPath, "utf8");
    const parsed = JSON.parse(raw);
    return NextResponse.json({
      workspace,
      project,
      ...parsed,
    });
  } catch {
    return NextResponse.json({
      workspace,
      project,
      roi_signals: {},
      tcc_signals: {},
      readiness: {},
      previous_sequences: [],
      last_refreshed: new Date().toISOString(),
    });
  }
}
