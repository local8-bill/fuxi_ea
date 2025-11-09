import type { VisionSuggestion } from "@/domain/ports/vision";

export async function analyzeVisionViaApi(
  params: { imageDataUrl?: string; note?: string }
): Promise<VisionSuggestion> {
  const res = await fetch("/api/vision/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Vision API ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Vision error");
  return json.suggestion as VisionSuggestion;
}