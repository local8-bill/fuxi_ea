export type CognitiveMetrics = {
  CL: number; // Cognitive Load (0-?)
  TF: number; // Task Friction
  ID: number; // Information Density
  DC: number; // Decision Clarity
};

export type SimplificationScores = {
  PSI: number; // Page Simplicity Index
  CSS?: number; // Component Simplicity Score
  SSS?: number; // System Simplicity Score
  FI?: number;  // Friction Index
  DCI?: number; // Decision Clarity Index
};

export type SimplificationSnapshot = {
  workspace: string;
  timestamp: string;
  metrics: CognitiveMetrics & SimplificationScores;
  context?: "Exploration" | "Execution";
};
