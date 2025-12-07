import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { jsonError, requireAuth } from "@/lib/api/security";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const INGESTED_DIR = path.join(DATA_ROOT, "ingested");
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_UPLOAD_BYTES) {
    return jsonError(413, "Upload too large");
  }

  try {
    const formData = await req.formData();
    const platform = (formData.get("platform") as string | null)?.trim() || undefined;
    const state = (formData.get("state") as string | null)?.trim() || undefined;
    let file: File | null = null;
    for (const value of formData.values()) {
      if (value instanceof File) {
        file = value;
        break;
      }
    }
    if (!file) return jsonError(400, "No file uploaded");

    const buf = Buffer.from(await file.arrayBuffer());
    const safeName = file.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "inventory.csv";
    await fs.mkdir(INGESTED_DIR, { recursive: true });
    await fs.writeFile(path.join(INGESTED_DIR, safeName), buf);

    const metaFile = path.join(INGESTED_DIR, "inventory_meta.json");
    try {
      const existingRaw = await fs.readFile(metaFile, "utf8");
      const parsed = JSON.parse(existingRaw) as Array<Record<string, any>>;
      parsed.push({
        file: safeName,
        uploadedAt: new Date().toISOString(),
        platform,
        state,
      });
      await fs.writeFile(metaFile, JSON.stringify(parsed, null, 2), "utf8");
    } catch {
      const initial = [
        {
          file: safeName,
          uploadedAt: new Date().toISOString(),
          platform,
          state,
        },
      ];
      await fs.writeFile(metaFile, JSON.stringify(initial, null, 2), "utf8");
    }

    return NextResponse.json({ ok: true, file: safeName, platform, state });
  } catch (err: any) {
    console.error("[INGESTION][inventory] failed", err);
    return jsonError(500, "Failed to save inventory file", err?.message);
  }
}
