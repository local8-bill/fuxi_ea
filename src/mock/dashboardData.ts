// Mock data for Fuxi EA Dashboard v0.1

export const digitalEnterpriseMetrics = {
  systems: 42,
  integrations: 118,
  domains: 6,
};

export const digitalEnterpriseSystems = [
  { name: "Order Management", integrations: 18, criticality: 0.82 },
  { name: "Inventory", integrations: 15, criticality: 0.78 },
  { name: "Customer Data Platform", integrations: 12, criticality: 0.7 },
  { name: "Commerce Core", integrations: 11, criticality: 0.68 },
  { name: "Billing", integrations: 9, criticality: 0.61 },
  { name: "Logistics", integrations: 8, criticality: 0.55 },
];

export const aiUtilization = {
  tokens: [
    { month: "Aug", input: 1.2, output: 0.7 },
    { month: "Sep", input: 1.4, output: 0.9 },
    { month: "Oct", input: 1.7, output: 1.1 },
    { month: "Nov", input: 1.5, output: 1.0 },
  ],
  cycles: [
    { label: "Architect", count: 24 },
    { label: "Builder", count: 36 },
    { label: "Operator", count: 18 },
    { label: "UX", count: 12 },
  ],
};

export const insightFeed = [
  {
    title: "Reduce overlap in messaging stack",
    detail: "4 systems in ‘Messaging & notifications’; consolidate to 1–2 platforms.",
    timestamp: "5m ago",
  },
  {
    title: "Inventory ingest coverage",
    detail: "72% of rows normalized; remaining flagged for vendor mapping.",
    timestamp: "38m ago",
  },
  {
    title: "Top risk: Order Management",
    detail: "18 integrations; recommend upstream/downstream impact simulation.",
    timestamp: "1h ago",
  },
  {
    title: "AI utilization",
    detail: "Output tokens up 12% MoM while latency held steady.",
    timestamp: "3h ago",
  },
];
