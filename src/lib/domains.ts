export const DOMAIN_OPTIONS = [
  "Commerce",
  "Supply Chain",
  "Marketing",
  "Finance",
  "HR",
  "Data & Analytics",
  "IT Platform",
  "Manufacturing",
  "Retail Ops",
  "Customer Experience",
  "Unassigned",
] as const;

export type Domain = typeof DOMAIN_OPTIONS[number];
export const isDomain = (x: string): x is Domain =>
  (DOMAIN_OPTIONS as readonly string[]).includes(x as any);