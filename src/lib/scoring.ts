import { Scores, Weights } from "@/types/capability";

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

export const average = (vals:number[]) => vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;

export function heatColor(score01: number) {
  if (score01 >= 0.75) return "bg-green-100 border-green-300";
  if (score01 >= 0.5)  return "bg-yellow-100 border-yellow-300";
  if (score01 >= 0.25) return "bg-orange-100 border-orange-300";
  return "bg-red-100 border-red-300";
}

export function aiCoachTip(s: Scores): string {
  const tips: string[] = [];
  if (s.maturity <= 2 && s.opportunity >= 4) tips.push("Low maturity + high opportunity: consider near-term investment.");
  if (s.techFit <= 2) tips.push("Tech fit is low: review platform alignment and integration constraints.");
  if (s.peopleReadiness <= 2) tips.push("People readiness is low: plan enablement and change mgmt early.");
  if (s.strategicAlignment <= 2) tips.push("Strategic alignment weak: validate business outcomes and KPIs.");
  if (!tips.length) return "Looks balanced. Explore adjacent capabilities for compounding value.";
  return tips.join(" \n• ");
}
