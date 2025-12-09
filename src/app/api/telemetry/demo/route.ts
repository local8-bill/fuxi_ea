import { NextResponse } from "next/server";
import { readTonePerformance, readConversationBehavior } from "@/lib/telemetry/demoMetrics";

export const runtime = "nodejs";

export async function GET() {
  const [tonePerformance, conversationBehavior] = await Promise.all([
    readTonePerformance(),
    readConversationBehavior(),
  ]);

  return NextResponse.json({ ok: true, tonePerformance, conversationBehavior });
}
