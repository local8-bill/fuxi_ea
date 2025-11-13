// src/app/api/cognition/capabilities/route.ts

import { NextResponse } from "next/server";
import { analyzeCapabilitiesStructure } from "@/domain/services/cognition";
import type { Capability } from "@/domain/model/capability";

export const runtime = "nodejs";

type Payload = {
  roots?: Capability[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload | null;

    const roots = Array.isArray(body?.roots) ? body!.roots : [];

    const result = analyzeCapabilitiesStructure(roots);

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("[Cognition/Capabilities] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "cognition analysis failed" },
      { status: 400 },
    );
  }
}
