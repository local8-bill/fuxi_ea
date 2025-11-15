import { NextRequest, NextResponse } from "next/server";
import { extractArchitectureBoxes } from "@/domain/services/mre";
import { v4 as uuid } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  const kind = formData.get("kind"); // "architecture_current" | "architecture_future"

  if (!(file instanceof File) || (kind !== "architecture_current" && kind !== "architecture_future")) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const extractedBoxes = await extractArchitectureBoxes(buffer);

  const artifact = {
    id: uuid(),
    projectId: (formData.get("projectId") as string) ?? "temp",
    kind,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json({ artifact, boxes: extractedBoxes });
}
