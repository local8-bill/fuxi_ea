import { NextRequest, NextResponse } from "next/server";
import { localVisionAdapter } from "@/adapters/vision/local";

export const runtime = "nodejs"; // ensure we run server-side

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });

    const buf = await file.arrayBuffer();
    const rows = await localVisionAdapter.extract(buf, { layoutHint: "mixed" });
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "vision error" }, { status: 500 });
  }
}