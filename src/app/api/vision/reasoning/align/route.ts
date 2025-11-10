import { NextResponse } from "next/server";
import { makeLocalReasoning } from "@/adapters/reasoning/local";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expects: { rows: Array<{id?:string,name:string,level:"L1"|"L2"|"L3",domain?:string,parent?:string}>, existingL1: string[] }
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const existingL1 = Array.isArray(body?.existingL1) ? body.existingL1 : [];

    const r = makeLocalReasoning();
    const result = await r.align({ rows, existingL1 });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "align failed" }, { status: 400 });
  }
}
