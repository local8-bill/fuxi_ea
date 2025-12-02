// src/adapters/reasoning/openai.ts
import OpenAI from "openai";
import type {
  ReasoningPort,
  ReasoningAlignInput,
  ReasoningAlignResult,
  ReasoningSuggestion,
} from "@/domain/ports/reasoning";
import { makeLocalReasoning } from "@/adapters/reasoning/local"; // for safe fallback
import type {
  ResponseOutputItem,
  ResponseOutputMessage,
  ResponseOutputText,
} from "openai/resources/responses/responses";

// Default model for cheap-ish alignment
const DEFAULT_MODEL = process.env.OPENAI_REASONING_MODEL ?? "gpt-4o-mini";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// Keep a single client per process (if configured)
const client = OPENAI_KEY
  ? new OpenAI({
      apiKey: OPENAI_KEY,
      organization: process.env.OPENAI_ORG_ID,
      project: process.env.OPENAI_PROJECT_ID,
    })
  : null;

export function makeOpenAIReasoning(): ReasoningPort {
  // If key is missing, we STILL return a ReasoningPort,
  // but we'll no-op and defer to local.
  const localFallback = makeLocalReasoning();

  return {
    async align(input: ReasoningAlignInput): Promise<ReasoningAlignResult> {
      if (!client) {
        console.warn("[Reasoning/OpenAI] OPENAI_API_KEY not set – using local fallback.");
        return localFallback.align(input);
      }

      // Hard cap to avoid users pasting 2,000 rows and blowing tokens
      const rows = input.rows.slice(0, 300);

      // Slim down payload for the model
      const payload = {
        rows: rows.map((r) => ({
          name: r.name,
          level: r.level,
          domain: r.domain ?? null,
          parent: r.parent ?? null,
        })),
        existingL1: input.existingL1,
      };

      const systemPrompt = `
You are an enterprise architecture assistant helping align imported capability rows
(L1–L3) to an existing capability map.

Rules:
- Do NOT invent new capabilities beyond what's given.
- For each row, decide if it should:
  - "merge" with an existing L1 (same concept),
  - "attach" as a child under a related capability,
  - or be "new" (no good match).
- Use the "existingL1" array only as names, not IDs.
- Be conservative: if unsure, prefer "new" with a clear reason.

You MUST respond strictly as JSON with:
{
  "suggestions": [
    {
      "sourceName": string,
      "action": "merge" | "attach" | "new",
      "reason": string
    }
  ],
  "issues": string[]
}
No markdown, no prose outside JSON.
`.trim();

      const userPrompt = `
Imported capability rows (trimmed):
${JSON.stringify(payload, null, 2)}
`.trim();

      try {
        // Option 1 (modern): responses API with JSON schema.
        // If you want Joshua to do minimal work first, you can
        // downgrade this to chat.completions.create with a plain text JSON contract.
        const response = await client.responses.create({
          model: DEFAULT_MODEL,
          input: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          text: {
            format: {
              name: "ReasoningAlignResult",
              type: "json_schema",
              schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sourceName: { type: "string" },
                        action: {
                          type: "string",
                          enum: ["merge", "attach", "new"],
                        },
                        reason: { type: "string" },
                      },
                      required: ["sourceName", "action", "reason"],
                      additionalProperties: false,
                    },
                  },
                  issues: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["suggestions", "issues"],
                additionalProperties: false,
              },
              strict: true,
            },
          },
        });

        // Extract the JSON content. `responses.create` returns
        // a content array; we want the first text block.
        const message = response.output.find(
          (item): item is ResponseOutputMessage => item.type === "message",
        );
        const textPart = message?.content.find(
          (c): c is ResponseOutputText => c.type === "output_text",
        );

        if (!textPart) {
          return {
            suggestions: [],
            issues: ["OpenAI reasoning: no JSON content returned"],
          };
        }

        const parsed = JSON.parse(textPart.text) as {
          suggestions: ReasoningSuggestion[];
          issues: string[];
        };

        // We DO NOT set targetId here – for now, the UI only cares about
        // showing suggestions + reasons. Later we can enrich with IDs using
        // local fuzzy matching if needed.
        return {
          suggestions: parsed.suggestions ?? [],
          issues: parsed.issues ?? [],
        };
      } catch (err: any) {
        console.error("[Reasoning/OpenAI] align failed:", err);
        return localFallback.align(input);
      }
    },
  };
}
