import { NextResponse } from "next/server";

export const runtime = "edge"; // optional: improves performance for API routes

// ---- Types ---- //
export type Level = "L1" | "L2" | "L3";

export interface CapabilitySuggestion {
  id?: string;
  name: string;
  level: Level;
  parentId?: string;
  domain?: string;
  description?: string;
  aliases?: string[];
}

export interface SuggestResponse {
  capabilities: CapabilitySuggestion[];
  notes?: string;
  templateSource?: string;
}

// ---- Helper: load static templates ---- //
async function loadStaticTemplate(industry: string): Promise<SuggestResponse | null> {
  try {
    const key = industry.toLowerCase();

    const coerce = (tpl: any): SuggestResponse => {
      const caps: CapabilitySuggestion[] = (tpl?.capabilities ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        level: (c.level as Level) ?? "L1",
        parentId: c.parentId,
        domain: c.domain,
        description: c.description,
        aliases: c.aliases,
      }));
      return {
        capabilities: caps,
        notes: tpl?.notes,
        templateSource: tpl?.templateSource ?? `static:${key}_v1`,
      };
    };

    if (key === "retail") {
      const tpl = (await import("@/data/templates/retail.json")).default as any;
      return coerce(tpl);
    }

    if (key === "banking") {
      const tpl = (await import("@/data/templates/banking.json")).default as any;
      return coerce(tpl);
    }

    if (key === "footwear" || key === "deckers") {
      const tpl = (await import("@/data/templates/deckers.json")).default as any;
      return coerce(tpl);
    }

    return null;
  } catch (err) {
    console.error("Failed to load static template:", err);
    return null;
  }
}

// ---- POST handler ---- //
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { industry } = body as { industry?: string };

    if (!industry) {
      return NextResponse.json(
        { error: "Missing industry parameter" },
        { status: 400 }
      );
    }

    // Try static templates first
    const staticTpl = await loadStaticTemplate(industry);
    if (staticTpl) return NextResponse.json(staticTpl);

    // Placeholder for future AI-powered generation
    return NextResponse.json({
      capabilities: [],
      notes: `No static template found for "${industry}".`,
      templateSource: "none",
    });
  } catch (err) {
    console.error("Error in suggest route:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}