export type NodeType = "system" | "domain" | "note" | "infra" | "unknown";

export type DigitalEnterpriseNode = {
  id: string;
  label: string;
  rawName?: string;
  rawShapeLibrary?: string;
  type: NodeType;
  domain?: string;
  containerId?: string;
  degree: number;
};

export type DigitalEnterpriseEdge = {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
};

export type DigitalEnterpriseViewKind = "future_architecture";

export type DigitalEnterpriseView = {
  projectId: string;
  view: DigitalEnterpriseViewKind;
  nodes: DigitalEnterpriseNode[];
  edges: DigitalEnterpriseEdge[];
};

export type DigitalEnterpriseTopSystem = {
  name: string;
  domain?: string;
  integrations: number;
};

export type DigitalEnterpriseStats = {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected: number;
  topSystems: DigitalEnterpriseTopSystem[];
};
