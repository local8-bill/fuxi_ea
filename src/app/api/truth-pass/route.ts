"use server";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 10, name: "truth-pass" });
const MAX_CANDIDATES = 400;

type TruthPassCandidate = {
  norm: string;
  inventoryName: string | null;
  diagramNames: string[];
};

interface TruthPassRequestBody {
  projectId?: string;
  candidates?: TruthPassCandidate[];
}

type TruthRow = {
  id: string;
  norm: string;
  inventoryName: string | null;
  diagramName: string | null;
  recommended: string;
  confidence: number;
  note: string;
};

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  if (!process.env.OPENAI_API_KEY) {
    return jsonError(500, "OPENAI_API_KEY not configured");
  }

  try {
    const body = (await req.json()) as TruthPassRequestBody;
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];

    if (candidates.length === 0) {
      return NextResponse.json({ ok: true, rows: [] });
    }

    if (candidates.length > MAX_CANDIDATES) {
      return jsonError(400, `Too many candidates (max ${MAX_CANDIDATES})`);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    const systemPrompt = `
You are Fuxi, an enterprise architecture assistant.

You receive a list of technology "candidates" that come from:
- an application inventory spreadsheet, and
- a Lucid architecture diagram.

Each candidate has:
- norm: normalized key (string)
- inventoryName: name from inventory (string or null)
- diagramNames: array of names from diagram (strings, possibly empty)

For each candidate, you must decide a canonical "recommended" system name and confidence.

Return a JSON object with:

{
  "rows": [
    {
      "id": string,                // stable row id, you can synthesize
      "norm": string,              // copy of the candidate norm
      "inventoryName": string|null,
      "diagramName": string|null,  // pick the best diagram name or null
      "recommended": string,       // canonical label
      "confidence": number,        // integer 0-100
      "note": string               // short 1-sentence explanation
    },
    ...
  ]
}

Rules:
- Prefer clear product / platform names (e.g., "Oracle E-Business Suite", "SAP ECC").
- If only inventoryName exists, recommended usually equals inventoryName.
- If only diagramNames exist, recommended usually matches the clearest diagram name.
- If both exist but differ, choose the one that feels like the real product name and explain why.
- Always return valid JSON only, no extra commentary.
`.trim();

    const userContent = JSON.stringify({ candidates });

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: { rows?: TruthRow[] };
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("[TRUTH-PASS] JSON parse error from model", err, raw);
      return NextResponse.json(
        {
          ok: false,
          error: "AI returned non-JSON",
          rows: [],
        },
        { status: 500 },
      );
    }

    const rows = Array.isArray(parsed.rows) ? parsed.rows : [];

    const safeRows: TruthRow[] = rows.map((r, idx) => {
      const candidate = candidates[idx];
      const fallbackNorm = candidate?.norm ?? r.norm ?? "";
      const fallbackInventory =
        r.inventoryName ??
        candidate?.inventoryName ??
        null;
      const fallbackDiagram =
        r.diagramName ??
        (candidate?.diagramNames?.[0] ?? null);

      let recommended =
        r.recommended ??
        fallbackInventory ??
        fallbackDiagram ??
        fallbackNorm;

      if (!recommended || typeof recommended !== "string") {
        recommended = fallbackNorm || "Unknown system";
      }

      const confidence =
        typeof r.confidence === "number"
          ? Math.max(0, Math.min(100, Math.round(r.confidence)))
          : 70;

      return {
        id: r.id ?? `row-${idx}`,
        norm: fallbackNorm,
        inventoryName: fallbackInventory,
        diagramName: fallbackDiagram,
        recommended,
        confidence,
        note:
          r.note ??
          "Suggestion based on inventory and diagram names.",
      };
    });

    return NextResponse.json({ ok: true, rows: safeRows });
  } catch (err: any) {
    console.error("[TRUTH-PASS] API error", err);
    return NextResponse.json(
      {
        ok: false,
        error: String(err?.message ?? err ?? "Unknown error"),
        rows: [],
      },
      { status: 500 },
    );
  }
}
