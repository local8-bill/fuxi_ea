import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface TruthPassCandidate {
  norm: string;
  inventoryName: string | null;
  diagramNames?: string[] | null;
}

type RecommendedSide = "inventory" | "diagram" | "none";

interface TruthPassRow {
  norm: string;
  inventoryName: string | null;
  diagramName: string | null;
  recommendedSide: RecommendedSide;
  recommendedName: string | null;
  confidencePct: number;
  rationale: string;
  source: "heuristic";
}

function scoreCandidate(c: TruthPassCandidate): TruthPassRow {
  const invName = c.inventoryName?.trim() || null;
  const diagramNames = (c.diagramNames ?? []).map((d) => d?.trim()).filter(Boolean) as string[];
  const primaryDiagram = diagramNames[0] ?? null;

  let recommendedSide: RecommendedSide = "none";
  let recommendedName: string | null = null;
  let confidencePct = 80;
  let rationale = "Heuristic suggestion based on available names.";

  // Inventory only
  if (invName && !primaryDiagram) {
    recommendedSide = "inventory";
    recommendedName = invName;
    confidencePct = 95;
    rationale = "Only appears in your inventory spreadsheet.";
  }
  // Diagram only
  else if (!invName && primaryDiagram) {
    recommendedSide = "diagram";
    recommendedName = primaryDiagram;
    confidencePct = 85;
    rationale = "Only appears in your diagram export.";
  }
  // Both present
  else if (invName && primaryDiagram) {
    recommendedSide = "diagram";
    recommendedName = primaryDiagram;
    confidencePct = 90;
    rationale = "Best guess based on normalized name and diagram label.";
  }
  // Neither present – this will be filtered out later
  else {
    recommendedSide = "none";
    recommendedName = null;
    confidencePct = 50;
    rationale = "Insufficient data to recommend a name.";
  }

  return {
    norm: c.norm,
    inventoryName: invName,
    diagramName: primaryDiagram,
    recommendedSide,
    recommendedName,
    confidencePct,
    rationale,
    source: "heuristic",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body?.projectId as string | undefined;
    const candidates = (body?.candidates ?? []) as TruthPassCandidate[];

    console.log("[TRUTH-PASS] POST", {
      projectId,
      candidates: Array.isArray(candidates) ? candidates.length : "invalid",
    });

    if (!Array.isArray(candidates)) {
      return NextResponse.json(
        { ok: false, error: "candidates must be an array", rows: [] },
        { status: 400 },
      );
    }

    const scoredRaw = candidates.map(scoreCandidate);

    // 🔑 Filter out the "blank" rows where BOTH sides are missing
    const rows = scoredRaw.filter((r) => {
      const hasInventory = !!(r.inventoryName && r.inventoryName.trim().length > 0);
      const hasDiagram = !!(r.diagramName && r.diagramName.trim().length > 0);
      return hasInventory || hasDiagram;
    });

    console.log("[TRUTH-PASS] scored rows", {
      projectId,
      input: candidates.length,
      output: rows.length,
    });

    return NextResponse.json({
      ok: true,
      rows,
    });
  } catch (err: any) {
    console.error("[TRUTH-PASS] API error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unexpected error in truth-pass API",
        rows: [],
      },
      { status: 500 },
    );
  }
}
