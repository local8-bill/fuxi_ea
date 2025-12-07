import { NextRequest, NextResponse } from "next/server";
import { performAgentAction } from "@/lib/agent/actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, action, context } = await req.json();
    if (!projectId || !action?.type) {
      return NextResponse.json({ error: "projectId and action.type are required" }, { status: 400 });
    }

    const { session, result } = await performAgentAction(projectId, action, context ?? {});

    return NextResponse.json({ session, result });
  } catch (err: any) {
    console.error("[/api/agent/execute] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
