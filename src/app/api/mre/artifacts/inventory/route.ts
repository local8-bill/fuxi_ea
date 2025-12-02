// src/app/api/mre/artifacts/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseInventoryExcel } from "@/domain/services/ingestion";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB inventory file ceiling
const rateLimit = createRateLimiter({ windowMs: 60_000, max: 10, name: "inventory-upload" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Upload too large");
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
