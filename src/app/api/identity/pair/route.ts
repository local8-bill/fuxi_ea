import { NextRequest, NextResponse } from "next/server";
import { createOrUpdatePairing, loadPairings } from "@/lib/identity/manifest";

export const runtime = "nodejs";

export async function GET() {
  const records = await loadPairings();
  return NextResponse.json({ pairings: records });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const humanManifest = body?.human_manifest ?? "founder_profile.json";
    const agentManifest = body?.agent_manifest ?? "agent_z.json";
    const approver = body?.approver;
    const decision = body?.decision;
    if (approver !== "fuxi" && approver !== "agent_z") {
      return NextResponse.json({ error: "Invalid approver" }, { status: 400 });
    }
    if (decision !== "approved" && decision !== "declined") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }
    const record = await createOrUpdatePairing({
      human_manifest: humanManifest,
      agent_manifest: agentManifest,
      approver,
      decision,
      signature: body?.signature,
    });
    return NextResponse.json({ pairing: record });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
