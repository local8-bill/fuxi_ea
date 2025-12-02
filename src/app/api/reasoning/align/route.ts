// src/app/api/reasoning/align/route.ts
import { NextRequest, NextResponse } from "next/server";
import { makeLocalReasoning } from "@/adapters/reasoning/local";
import { makeOpenAIReasoning } from "@/adapters/reasoning/openai";
import type { ReasoningAlignInput } from "@/domain/ports/reasoning";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs"; // we want full Node, not edge

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 20, name: "reasoning-align" });

function getReasoningAdapter() {
  const mode = process.env.REASONING_MODE ?? "local";
  if (mode === "openai") {
    return makeOpenAIReasoning();
  }
  return makeLocalReasoning();
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const body = (await req.json()) as Partial<ReasoningAlignInput>;
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const existingL1 = Array.isArray(body.existingL1) ? body.existingL1 : [];

    const adapter = getReasoningAdapter();
    const result = await adapter.align({ rows, existingL1 });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("[Reasoning API] align error:", e);
    return jsonError(400, "align failed", e?.message);
  }
}
