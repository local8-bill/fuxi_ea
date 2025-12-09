import { NextResponse } from "next/server";
import { getActivePairing, loadManifestFile } from "@/lib/identity/manifest";

export const runtime = "nodejs";

export async function GET() {
  const pairing = await getActivePairing();
  const founder = await loadManifestFile(pairing?.human_manifest ?? "founder_profile.json");
  const agent = await loadManifestFile(pairing?.agent_manifest ?? "agent_z.json");
  return NextResponse.json({
    founder,
    agent,
    pairing,
  });
}
