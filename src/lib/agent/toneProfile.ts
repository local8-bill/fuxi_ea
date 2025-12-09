import type { ToneProfile } from "@/types/agent";

const TECH_KEYWORDS = ["erp", "crm", "roi", "tcc", "sequencer", "harmonization", "finance", "integration", "analytics", "platform"];

const DEFAULT_PROFILE: ToneProfile = { formality: "neutral", verbosity: "medium", keywords: [] };

const blend = (prev: number, next: number, weight: number) => prev * weight + next * (1 - weight);

const verbosityScore = (text: string) => {
  const length = text.length;
  if (length <= 40) return 0;
  if (length >= 160) return 1;
  return length / 160;
};

const formalityScore = (text: string) => {
  const trimmed = text.trim();
  const endsProperly = /[.!?]$/.test(trimmed);
  const startsCapitalized = /^[A-Z]/.test(trimmed);
  if (endsProperly && startsCapitalized) return 1;
  if (trimmed.split(/\s+/).length <= 4) return 0;
  return 0.5;
};

export function analyzeUserTone(input: string): ToneProfile {
  if (!input?.trim()) return DEFAULT_PROFILE;
  const lower = input.toLowerCase();
  const words = input.trim().split(/\s+/);
  const keywordHits = TECH_KEYWORDS.filter((keyword) => lower.includes(keyword));
  let formality: ToneProfile["formality"] = "neutral";
  const formalityValue = formalityScore(input);
  if (formalityValue >= 0.8 || keywordHits.length >= 2) {
    formality = "formal";
  } else if (words.length <= 4) {
    formality = "concise";
  }

  const verbScore = verbosityScore(input);
  const verbosity: ToneProfile["verbosity"] = verbScore >= 0.66 ? "high" : verbScore <= 0.25 ? "low" : "medium";

  return {
    formality,
    verbosity,
    keywords: keywordHits,
  };
}

export function blendProfiles(previous: ToneProfile | undefined, fresh: ToneProfile, weight = 0.7): ToneProfile {
  if (!previous) return fresh;
  const formality = fresh.formality === previous.formality ? fresh.formality : fresh.formality === "formal" ? "formal" : fresh.formality;
  const verbosityLevels: Record<ToneProfile["verbosity"], number> = { low: 0, medium: 0.5, high: 1 };
  const reverseVerbosity: Array<ToneProfile["verbosity"]> = ["low", "medium", "high"];
  const verbIndex = blend(verbosityLevels[previous.verbosity], verbosityLevels[fresh.verbosity], weight);
  const blendedVerbosity = reverseVerbosity[Math.round(verbIndex * 2)] || fresh.verbosity;

  const uniqueKeywords = Array.from(new Set([...previous.keywords, ...fresh.keywords])).slice(-6);
  return {
    formality,
    verbosity: blendedVerbosity,
    keywords: uniqueKeywords,
  };
}

export function defaultToneProfile(): ToneProfile {
  return DEFAULT_PROFILE;
}
