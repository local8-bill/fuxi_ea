import { NextResponse } from "next/server";
import { verifyLatestBackupOnServer } from "@/agents/dx/liveMonitorServer";

export const runtime = "nodejs";

export async function GET() {
  const ok = verifyLatestBackupOnServer();
  return NextResponse.json({
    ok,
    message: ok ? "💾 dx: Latest backup verified." : "⚠️ dx: Backup verification incomplete.",
  });
}
