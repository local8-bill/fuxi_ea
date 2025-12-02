// src/app/api/cognition/capabilities/route.ts

import { NextRequest, NextResponse } from "next/server";
import { analyzeCapabilitiesStructure } from "@/domain/services/cognition";
import type { Capability } from "@/domain/model/capability";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

type Payload = {
  roots?: Capability[];
};

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: "cognition-capabilities" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const body = (await req.json()) as Payload | null;

    const roots = Array.isArray(body?.roots) ? body!.roots : [];

    const result = analyzeCapabilitiesStructure(roots);

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("[Cognition/Capabilities] Error:", e);
    return jsonError(400, "cognition analysis failed", e?.message);
  }
}
