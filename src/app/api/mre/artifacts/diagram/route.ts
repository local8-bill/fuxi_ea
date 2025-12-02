import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractArchitectureBoxes } from "@/domain/services/mre";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const rateLimit = createRateLimiter({ windowMs: 60_000, max: 10, name: "diagram-upload" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return jsonError(400, "Missing file");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, "Upload too large");
  }

  if (kind !== "architecture_current" && kind !== "architecture_future") {
    return jsonError(400, "Bad 'kind' parameter");
  }

  const projectId = (formData.get("projectId") as string) ?? "temp";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const boxes = await extractArchitectureBoxes(buffer);

  const artifact = {
    id: randomUUID(),
    projectId,
    kind,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json({ artifact, boxes });
}
