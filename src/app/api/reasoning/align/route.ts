// src/app/api/reasoning/align/route.ts
import { NextResponse } from "next/server";
import { makeLocalReasoning } from "@/adapters/reasoning/local";
import type { ReasoningAlignInput, ReasoningAlignResult } from "@/domain/ports/reasoning";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReasoningAlignInput;
    const r = makeLocalReasoning();
    const result = await r.align(body);
    return NextResponse.json({ ok: true, result });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "align failed",
      },
      { status: 400 }
    );
  }
}
