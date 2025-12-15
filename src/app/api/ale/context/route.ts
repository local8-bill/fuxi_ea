import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    workspace: "digital_enterprise",
    project: "dev",
    roi_signals: {},
    tcc_signals: {},
    readiness: {},
    previous_sequences: [],
    last_refreshed: new Date().toISOString(),
  });
}
