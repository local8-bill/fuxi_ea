// src/app/api/mre/artifacts/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseInventoryExcel } from "@/domain/services/ingestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const projectId = (formData.get("projectId") as string) ?? "temp";
    const kind = (formData.get("kind") as string) ?? "inventory_excel";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const inventoryRows = parseInventoryExcel(buffer, file.name);
    console.log(
      "[Inventory API] filename=%s rows=%d",
      file.name,
      inventoryRows.length,
    );

    const artifact = {
      id: randomUUID(),
      projectId,
      kind,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      artifact,
      inventoryRows,
    });
  } catch (err) {
    console.error("[Inventory API] failed:", err);
    return NextResponse.json(
      { error: "Failed to process inventory" },
      { status: 500 },
    );
  }
}
