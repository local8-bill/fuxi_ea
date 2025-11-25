import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import type { Artifact, ArtifactKind } from "@/domain/model/modernization";
import { parseLucidCsv } from "@/domain/services/lucidIngestion";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const rateLimit = createRateLimiter({ windowMs: 60_000, max: 10, name: "lucid-upload" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = (formData.get("projectId") as string) ?? "unknown";

    if (!(file instanceof File)) {
      return jsonError(400, "Missing file");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Upload too large");
    }

    const arrayBuffer = await file.arrayBuffer();
    const text = Buffer.from(arrayBuffer).toString("utf8");

    // Use the shared Lucid CSV parser (future + current view if you like)
    const lucidItems = parseLucidCsv(text);

    const artifact: Artifact = {
      id: uuid(),
      projectId,
      // Re-use the existing artifact kind union; Lucid is effectively a future-state architecture diagram
      kind: "architecture_future" as ArtifactKind,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        artifact,
        lucidItems,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("mre/artifacts/lucid POST error", err);
    return NextResponse.json(
      { error: "Failed to process Lucid CSV" },
      { status: 500 },
    );
  }
}
