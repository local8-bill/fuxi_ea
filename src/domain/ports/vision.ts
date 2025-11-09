export type VisionAnalyzeInput = {
  // Either a data URL (data:image/png;base64,...) or raw bytes (when using multipart)
  imageDataUrl?: string;
  note?: string;
};

export type VisionSuggestion = {
  name: string;          // suggested L1 title
  domain: string;        // guessed domain
  confidence: number;    // 0..1 simple heuristic
};

export interface VisionPort {
  analyze(input: VisionAnalyzeInput): Promise<VisionSuggestion>;
}