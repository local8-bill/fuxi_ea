import { NextResponse } from "next/server";
import { makeLocalVision } from "@/adapters/vision/local";

export const runtime = "nodejs"; // safe on vercel

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let imageDataUrl: string | undefined;
    let note: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // parse form-data
      const form = await req.formData();
      const file = form.get("image");
      note = (form.get("note") as string) || undefined;

      if (file && file instanceof File) {
        const buf = Buffer.from(await file.arrayBuffer());
        const base64 = buf.toString("base64");
        const mime = file.type || "application/octet-stream";
        imageDataUrl = `data:${mime};base64,${base64}`;
      }
    } else {
      // parse JSON
      const body = await req.json().catch(() => ({}));
      imageDataUrl = body.imageDataUrl as string | undefined;
      note = body.note as string | undefined;
    }

    // For the local heuristic, we don’t actually need the pixels; we keep it for parity.
    const vision = makeLocalVision();
    const suggestion = await vision.analyze({ imageDataUrl, note });

    return NextResponse.json({ ok: true, suggestion });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Vision analyze failed" },
      { status: 400 }
    );
  }
}