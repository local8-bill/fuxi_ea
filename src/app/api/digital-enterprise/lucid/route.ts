import { NextRequest, NextResponse } from "next/server";
import { parseLucidCsv } from "@/domain/services/lucidIngestion";
import {
  saveDigitalEnterpriseView,
  getStatsForProject,
} from "@/domain/services/digitalEnterpriseStore";
import { normalizeLucidData } from "@/domain/services/ingestion";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB ceiling for CSV
const rateLimit = createRateLimiter({ windowMs: 60_000, max: 12, name: "de-lucid" });

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") ?? "default";

  console.log("[DE-LUCID] POST start", { projectId });

  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Upload too large");
    }

    const formData = await req.formData();
    const keys = Array.from(formData.keys());
    console.log("[DE-LUCID] formData keys", { keys });

    // Be flexible: accept any field name, just find the first File in FormData
    let file: File | null = null;
    for (const value of formData.values()) {
      if (value instanceof File) {
        file = value;
        break;
      }
    }

    if (!file) {
      console.error("[DE-LUCID] No file found in formData");
      return jsonError(400, "No file uploaded");
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, "Upload too large");
    }

    const text = await file.text();
    console.log("[DE-LUCID] Read file text", { length: text.length });

    const view = parseLucidCsv(text);
    console.log("[DE-LUCID] Parsed Lucid CSV", {
      nodes: view.nodes.length,
      edges: view.edges.length,
    });

    // Normalize for D027 pipeline and persist cleaned output
    try {
      await normalizeLucidData(text);
    } catch (err) {
      console.warn("[DE-LUCID] normalizeLucidData failed", err);
    }

    // CRITICAL: pass the parsed view into the store
    await saveDigitalEnterpriseView(projectId, view);

    const stats = await getStatsForProject(projectId);
    console.log("[DE-LUCID] Success", {
  projectId,
  stats,
});

    return NextResponse.json(
      {
        ok: true,
        projectId,
        stats,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[DE-LUCID] ERROR", {
      projectId,
      message: err?.message ?? String(err),
      stack: err?.stack,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to parse Lucid CSV",
        detail: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
