export type LearningMetrics = {
  risk: number;
  confidence: number;
  velocity: number;
  maturity: number;
};

export type GraphContext = {
  systems: number;
  integrations: number;
  domains: number;
  classificationMix?: Record<string, number>;
  riskModifier?: number;
  derivedWaveTarget?: number;
};

export type LearningEvent = {
  projectId: string;
  type: string;
  intent?: string;
  wave?: number;
  totalWaves?: number;
};
