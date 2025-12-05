import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, platforms = [], strategy = "value" } = await req.json();

    const waves = [
      {
        id: "wave-1",
        title: "Stabilize Core",
        focus: platforms.slice(0, 2).join(", ") || "ERP / OMS",
        timelineMonths: [0, 3],
      },
      {
        id: "wave-2",
        title: "Modernize Experience + Integrations",
        focus: platforms.slice(2, 4).join(", ") || "Commerce + Integration",
        timelineMonths: [3, 6],
      },
      {
        id: "wave-3",
        title: "Scale AI + Analytics",
        focus: "Data / Analytics",
        timelineMonths: [6, 9],
      },
    ];

    return NextResponse.json({
      status: "ok",
      projectId,
      strategy,
      waves,
      telemetry: { event: "sequencing_generated", projectId, strategy },
    });
  } catch (err: any) {
    console.error("[/api/sequence/plan] error", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 });
  }
}
