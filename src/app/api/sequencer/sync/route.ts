import { NextRequest, NextResponse } from "next/server";
import { recordIntentFeedback } from "@/lib/change-intelligence/intent-model";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    await recordIntentFeedback(data);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Unable to record event" }, { status: 500 });
  }
}
