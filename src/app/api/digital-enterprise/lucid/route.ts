import { NextRequest, NextResponse } from "next/server";
import { parseLucidCsv } from "@/domain/services/lucidIngestion";
import {
  saveLucidItemsForProject,
  getStatsForProject,
} from "@/domain/services/digitalEnterpriseStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const projectId = (form.get("projectId") ?? "").toString().trim();
    const view = (form.get("view") ?? "future").toString().trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing project id" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString("utf8");
    const csvLines = csvText.split(/\r?\n/).slice(0, 10);

    console.log("======= LUCID CSV FIRST 10 LINES =======");
    for (const line of csvLines) console.log(line);
    console.log("========================================");

    const items = parseLucidCsv(buffer, { projectId, view });

    console.log(
      `Lucid parsed for project=${projectId}: ${items.length} items total`,
    );

    saveLucidItemsForProject(projectId, items);

    const stats = getStatsForProject(projectId);

    return NextResponse.json(
      {
        ok: true,
        message: "Lucid parsed",
        counts: {
          items: items.length,
          systemsFuture: stats.systemsFuture,
          integrationsFuture: stats.integrationsFuture,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("digital-enterprise/lucid POST error", err);
    return NextResponse.json(
      { ok: false, error: "Failed to parse Lucid CSV" },
      { status: 500 },
    );
  }
}
