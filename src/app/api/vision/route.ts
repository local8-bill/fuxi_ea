// src/app/api/reasoning/align/route.ts
import { NextResponse } from "next/server";
import { makeLocalReasoning } from "@/adapters/reasoning/local";
import type { ReasoningAlignInput, ReasoningAlignResult } from "@/domain/ports/reasoning";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ReasoningAlignInput>;
    const rows = Array.isArray(body?.rows) ? body!.rows : [];
    const existingL1 = Array.isArray(body?.existingL1) ? body!.existingL1 : [];

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "rows[] required" },
        { status: 400 }
      );
    }

    // v1: local matcher (fast, offline)
    const r = makeLocalReasoning();
    const result: ReasoningAlignResult = await r.align({ rows, existingL1 });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "align failed" },
      { status: 400 }
    );
  }
}
