export type AggressionLevel = "steady" | "balanced" | "aggressive";
export type ChangeAbsorption = "limited" | "normal" | "high";

export interface ProjectIntake {
  projectId: string;

  industry: string | null;
  drivers: string[];

  aggression: AggressionLevel | null;
  changeAbsorption: ChangeAbsorption | null;

  untouchables?: string[];
  bigBetDomains?: string[];

  constraints?: {
    budget?: string | null;
    deliveryCapacity?: string | null;
    changeTolerance?: string | null;
  };
}
