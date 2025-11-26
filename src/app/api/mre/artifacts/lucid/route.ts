import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import type { Artifact, ArtifactKind } from "@/domain/model/modernization";
import { parseLucidCsv } from "@/domain/services/lucidIngestion";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = (formData.get("projectId") as string) ?? "unknown";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file" },
        { status: 400 },
      );
    }

    // Use the shared Lucid CSV parser (future + current view if you like)
    const arrayBuffer = await file.arrayBuffer();
    const csvText = Buffer.from(arrayBuffer).toString("utf8");
    const lucidItems = await parseLucidCsv(csvText);

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
