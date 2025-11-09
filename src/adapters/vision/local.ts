import type { VisionAnalyzeInput, VisionPort, VisionSuggestion } from "@/domain/ports/vision";

// absolutely no external calls — cheap rules + optional note keyword hints
export function makeLocalVision(): VisionPort {
  return {
    async analyze(input: VisionAnalyzeInput): Promise<VisionSuggestion> {
      const note = (input.note ?? "").trim();

      const domain =
        /supply|inventory|warehouse|logistics|fulfillment/i.test(note) ? "Supply Chain" :
        /commerce|checkout|pdp|cart|catalog|merch|omn(i)?channel/i.test(note) ? "Digital Commerce" :
        /finance|fp&a|budget|accounting|cost/i.test(note) ? "Finance" :
        /data|analytics|bi|insights|ml|ai/i.test(note) ? "Data & Analytics" :
        /strategy|planning|roadmap|portfolio/i.test(note) ? "Strategy" :
        "Unassigned";

      const name = deriveTitle(note) || "New Capability";
      const confidence =
        domain === "Unassigned" ? 0.4 :
        Math.min(0.9, 0.55 + Math.min(0.35, note.length / 120));

      return { name, domain, confidence };
    }
  };
}

function deriveTitle(s: string): string {
  if (!s) return "";
  // First sentence → Title Case (cap at ~6 words)
  const first = s.replace(/\s+/g, " ").trim().split(/[.!?]\s*/)[0];
  return first
    .split(" ")
    .slice(0, 6)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}