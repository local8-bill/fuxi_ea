import { NextRequest, NextResponse } from "next/server";
import { extractArchitectureBoxes } from "@/domain/services/mre";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (kind !== "architecture_current" && kind !== "architecture_future") {
    return NextResponse.json({ error: "Bad 'kind' parameter" }, { status: 400 });
  }

  const projectId = (formData.get("projectId") as string) ?? "temp";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const boxes = await extractArchitectureBoxes(buffer);

  const artifact = {
    id: crypto.randomUUID(),
    projectId,
    kind,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json({ artifact, boxes });
}
