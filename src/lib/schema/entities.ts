import { z } from "zod";

export const DomainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const SystemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domainId: z.string().optional(),
  vendor: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  disposition: z.enum(["keep", "modernize", "replace", "retire"]).optional(),
  owner: z.string().optional(),
  cost: z.number().optional(),
  roiScore: z.number().min(0).max(100).optional(),
  aiOpportunityScore: z.number().min(0).max(100).optional(),
  integrations: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const IntegrationSchema = z.object({
  id: z.string().min(1),
  sourceSystemId: z.string().min(1),
  targetSystemId: z.string().min(1),
  type: z.enum(["API", "Data", "Workflow", "Manual"]).optional(),
  frequency: z.string().optional(),
  dataVolume: z.string().optional(),
  criticality: z.enum(["low", "medium", "high"]).optional(),
  status: z.string().optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const CapabilitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  maturity: z.number().min(0).max(1).optional(),
  domainId: z.string().optional(),
  linkedSystems: z.array(z.string()).optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const ROIResultSchema = z.object({
  id: z.string().min(1),
  systemId: z.string().min(1),
  impactScore: z.number().min(0).max(1),
  effortScore: z.number().min(0).max(1),
  savingsAnnual: z.number().optional(),
  paybackPeriodMonths: z.number().optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const AIInsightSchema = z.object({
  id: z.string().min(1),
  systemId: z.string().min(1),
  frictionZones: z.array(z.string()).optional(),
  primitive: z.string().optional(),
  impact: z.number().min(0).max(100).optional(),
  effort: z.number().min(0).max(100).optional(),
  readiness: z.number().min(0).max(100).optional(),
  opportunityIndex: z.number().min(0).max(100).optional(),
  recommendation: z.string().optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const EventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  type: z.enum(["decommission", "integration_change", "golive", "incident", "domain_modernized"]).optional(),
  targetSystemId: z.string().optional(),
  targetIntegrationId: z.string().optional(),
  description: z.string().optional(),
  impact: z
    .object({
      upstream: z.number().optional(),
      downstream: z.number().optional(),
    })
    .optional(),
  lastUpdated: z.string().optional(),
  source: z.string().optional(),
});

export const KPISchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  metric: z.number(),
  unit: z.string().optional(),
  baseline: z.number().optional(),
  source: z.string().optional(),
  relatedDomainId: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export type Domain = z.infer<typeof DomainSchema>;
export type System = z.infer<typeof SystemSchema>;
export type Integration = z.infer<typeof IntegrationSchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type ROIResult = z.infer<typeof ROIResultSchema>;
export type AIInsight = z.infer<typeof AIInsightSchema>;
export type Event = z.infer<typeof EventSchema>;
export type KPI = z.infer<typeof KPISchema>;
