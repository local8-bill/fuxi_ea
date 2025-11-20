
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs";

type TruthPassCandidate = {
  norm: string;
  inventoryName?: string | null;
  diagramNames?: string[];
};

type TruthPassRow = {
  norm: string;
  inventoryName: string | null;
  diagramNames: string[];
  recommended: string;
  confidence: number;
  reason: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const candidates: TruthPassCandidate[] = Array.isArray(body?.candidates)
      ? body.candidates
      : [];

    if (!candidates.length) {
      return NextResponse.json(
        {
          ok: true,
          rows: [],
        },
        { status: 200 }
      );
    }

    console.log("[TRUTH-PASS] Incoming candidates", {
      count: candidates.length,
    });

    // If no API key is configured, fall back to a simple heuristic
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "[TRUTH-PASS] No OPENAI_API_KEY set – using heuristic fallback"
      );
      const fallbackRows: TruthPassRow[] = candidates.map((c) => {
        const inventoryName = (c.inventoryName ?? "").trim() || null;
        const diagramNames = (c.diagramNames ?? []).map((d) => d.trim());
        const firstDiagram = diagramNames[0] ?? "";

        let recommended = firstDiagram || inventoryName || c.norm;
        let confidence = firstDiagram && inventoryName ? 85 : 70;
        let reason =
          firstDiagram && inventoryName
            ? "Diagram and inventory both provide plausible names; preferring diagram as canonical."
            : "No AI available; using best-effort heuristic from provided names.";

        return {
          norm: c.norm,
          inventoryName,
          diagramNames,
          recommended,
          confidence,
          reason,
        };
      });

      return NextResponse.json(
        {
          ok: true,
          rows: fallbackRows,
        },
        { status: 200 }
      );
    }

    const systemPrompt = [
      "You are helping an enterprise architect reconcile system names",
      "between an inventory spreadsheet and an architecture diagram.",
      "",
      "You will receive JSON with a list of candidates:",
      "{",
      '  \"candidates\": [',
      '    { \"norm\": string, \"inventoryName\": string | null, \"diagramNames\": string[] }',
      "  ]",
      "}",
      "",
      "For each candidate you must decide a single canonical system name.",
      "",
      "Rules:",
      "- Prefer official product names (e.g. 'Oracle E-Business Suite' over 'Oracle EBS')",
      "- If inventory and diagram clearly refer to the same thing, pick the most precise / canonical label",
      "- If only one side is populated, use that name as recommended",
      "- Confidence is a number 0-100",
      "- Reason is a short, single-sentence explanation",
      "",
      "Return ONLY valid JSON in this exact shape:",
      "{",
      '  \"rows\": [',
      "    {",
      '      \"norm\": string,',
      '      \"inventoryName\": string | null,',
      '      \"diagramNames\": string[],',
      '      \"recommended\": string,',
      '      \"confidence\": number,',
      '      \"reason\": string',
      "    }",
      "  ]",
      "}",
    ].join("\n");

    const userPayload = {
      candidates: candidates.map((c) => ({
        norm: c.norm,
        inventoryName: c.inventoryName ?? null,
        diagramNames: c.diagramNames ?? [],
      })),
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("[TRUTH-PASS] AI returned non-JSON", err, content);
      return NextResponse.json(
        {
          ok: false,
          error: "AI returned non-JSON",
          rows: [],
          raw: content,
        },
        { status: 500 }
      );
    }

    const rows = Array.isArray(parsed.rows) ? parsed.rows : [];

    console.log("[TRUTH-PASS] AI rows", { count: rows.length });

    return NextResponse.json(
      {
        ok: true,
        rows,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[TRUTH-PASS] Unhandled error", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Truth pass failed",
        rows: [],
      },
      { status: 500 }
    );
  }
}
