export type Scores = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export type Weights = {
  opportunity: number;
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
};

export const DEFAULT_SCORES: Scores = {
  opportunity: 3,
  maturity: 3,
  techFit: 3,
  strategicAlignment: 3,
  peopleReadiness: 3,
};

export const defaultWeights: Weights = {
  opportunity: 0.30,
  maturity: 0.20,
  techFit: 0.20,
  strategicAlignment: 0.20,
  peopleReadiness: 0.10,
};

const clamp = (v:number,min=1,max=5)=>Math.max(min,Math.min(max,v));
const norm = (x:number)=> (clamp(x)-1)/4;

export function compositeScore(s: Scores, w: Weights = defaultWeights) {
  const score =
    norm(s.opportunity)*w.opportunity +
    norm(s.maturity)*w.maturity +
    norm(s.techFit)*w.techFit +
    norm(s.strategicAlignment)*w.strategicAlignment +
    norm(s.peopleReadiness)*w.peopleReadiness;
  return Math.round(score*100)/100;
}

export const average = (vals:number[]) =>
  vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
