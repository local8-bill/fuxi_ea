import readinessFactors from "@/data/org_insights/readiness_factors.json";

export type OrgType = "product-led" | "service-led" | "hybrid";

export type ReadinessSignals = {
  business_readiness: number;
  business_willingness: number;
  business_capability: number;
  business_urgency: number;
  resistance_to_change: number;
  support_presence: number;
};

type ReadinessWeights = {
  readiness: number;
  willingness: number;
  capability: number;
  urgency: number;
  resistance: number;
  support: number;
};

const WEIGHTS: Record<OrgType, ReadinessWeights> = {
  "product-led": {
    readiness: 0.25,
    willingness: 0.15,
    capability: 0.25,
    urgency: 0.15,
    resistance: 0.1,
    support: 0.1,
  },
  "service-led": {
    readiness: 0.2,
    willingness: 0.15,
    capability: 0.3,
    urgency: 0.1,
    resistance: 0.15,
    support: 0.1,
  },
  hybrid: {
    readiness: 0.22,
    willingness: 0.18,
    capability: 0.22,
    urgency: 0.18,
    resistance: 0.1,
    support: 0.1,
  },
};

export type ReadinessComputation = {
  composite: number;
  successProbability: number;
  weighted: {
    readiness: number;
    willingness: number;
    capability: number;
    urgency: number;
    resistance: number;
    support: number;
  };
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function computeReadinessScore(signals: ReadinessSignals, orgType: OrgType = "hybrid"): ReadinessComputation {
  const weights = WEIGHTS[orgType];
  const readiness = clamp(signals.business_readiness);
  const willingness = clamp(signals.business_willingness);
  const capability = clamp(signals.business_capability);
  const urgency = clamp(signals.business_urgency);
  const resistance = clamp(signals.resistance_to_change);
  const support = clamp(signals.support_presence);

  const composite =
    readiness * weights.readiness +
    willingness * weights.willingness +
    capability * weights.capability +
    urgency * weights.urgency -
    resistance * weights.resistance +
    support * weights.support;

  const successProbability = sigmoid(3.5 * composite + 1.5 * urgency - 2.5 * resistance);

  return {
    composite: clamp(Number(composite.toFixed(4))),
    successProbability: clamp(Number(successProbability.toFixed(4))),
    weighted: {
      readiness,
      willingness,
      capability,
      urgency,
      resistance,
      support,
    },
  };
}

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

export type ReadinessSnapshot = {
  organization: string;
  orgType: OrgType;
  signals: ReadinessSignals;
  confidence: number;
  lastUpdated: string;
  composite: number;
  successProbability: number;
};

export function getReadinessSnapshot(): ReadinessSnapshot {
  const factors = readinessFactors as {
    organization: string;
    org_type: OrgType;
    signals: ReadinessSignals;
    confidence?: number;
    last_updated?: string;
  };

  const computation = computeReadinessScore(factors.signals, factors.org_type);
  return {
    organization: factors.organization,
    orgType: factors.org_type,
    signals: factors.signals,
    confidence: factors.confidence ?? 0.85,
    lastUpdated: factors.last_updated ?? new Date().toISOString(),
    composite: computation.composite,
    successProbability: computation.successProbability,
  };
}
