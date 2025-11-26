// src/app/api/reasoning/align/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeLocalReasoning } from "@/adapters/reasoning/local";
import type { ReasoningAlignInput, ReasoningAlignResult } from "@/domain/ports/reasoning";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 30, name: "vision-align" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const body = (await req.json()) as Partial<ReasoningAlignInput>;
    const rows = Array.isArray(body?.rows) ? body!.rows : [];
    const existingL1 = Array.isArray(body?.existingL1) ? body!.existingL1 : [];

    if (!rows.length) {
      return jsonError(400, "rows[] required");
    }

    // v1: local matcher (fast, offline)
    const r = makeLocalReasoning();
    const result: ReasoningAlignResult = await r.align({ rows, existingL1 });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return jsonError(400, "align failed", e?.message);
  }
}
