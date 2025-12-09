const ACTION_DELAYS: Record<string, number> = {
  "graph.harmonize": 2000,
  "sequence.plan": 1500,
  "roi.summary": 1200,
  "review.resume": 1000,
};

export function getActionDelay(actionType: string): number {
  return ACTION_DELAYS[actionType] ?? 0;
}
