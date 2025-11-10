import { NextResponse } from "next/server";
import { localVisionAdapter } from "@/adapters/vision/local";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // A) Content-Type guard
    const ct = req.headers.get("content-type") || "";
    if (!/multipart\/form-data/i.test(ct)) {
      console.error("[VisionAPI] bad content-type:", ct);
      return NextResponse.json(
        { ok: false, step: "bad-content-type", contentType: ct },
        { status: 415 }
      );
    }

    // B) Parse form + file
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      console.error("[VisionAPI] missing 'file' field");
      return NextResponse.json(
        { ok: false, step: "missing-file" },
        { status: 400 }
      );
    }

    // C) Read file as ArrayBuffer (use 'bytes', not 'bytes.buffer')
    const bytes = await file.arrayBuffer();

    // D) Extract rows via local adapter
    const rows = await localVisionAdapter.extract(bytes, { layoutHint: "mixed" });

    // E) Success
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    console.error("[VisionAPI] outer-catch:", e);
    return NextResponse.json(
      { ok: false, step: "outer-catch", error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
