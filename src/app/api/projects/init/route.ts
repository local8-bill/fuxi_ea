import { NextResponse } from "next/server";
import { initProject } from "@/domain/services/projectFlow";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { projectId?: string; metadata?: Record<string, unknown> } | null;
    const { projectId } = await initProject(body?.projectId, body?.metadata);
    return NextResponse.json({ ok: true, projectId });
  } catch (err: any) {
    console.error("[PROJECT-INIT] failed", err);
    return NextResponse.json({ ok: false, error: "Failed to init project" }, { status: 500 });
  }
}
