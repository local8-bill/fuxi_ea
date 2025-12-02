import { NextRequest, NextResponse } from "next/server";
import { localVisionAdapter } from "@/adapters/vision/local";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB safety cap
const rateLimit = createRateLimiter({ windowMs: 60_000, max: 12, name: "vision-analyze" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    // A) Content-Type guard
    const ct = req.headers.get("content-type") || "";
    if (!/multipart\/form-data/i.test(ct)) {
      console.error("[VisionAPI] bad content-type:", ct);
      return jsonError(415, "Unsupported content type");
    }

    // B) Parse form + file
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      console.error("[VisionAPI] missing 'file' field");
      return jsonError(400, "Missing file");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Upload too large");
    }

    // C) Read file as ArrayBuffer (use 'bytes', not 'bytes.buffer')
    const bytes = await file.arrayBuffer();

    // D) Extract rows via local adapter
    const rows = await localVisionAdapter.extract(bytes, { layoutHint: "mixed" });

    // E) Success
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    console.error("[VisionAPI] outer-catch:", e);
    return jsonError(500, "Vision analysis failed", e?.message || String(e));
  }
}
