export type DiagramViewKind = "lucid_architecture";

export type DiagramNode = {
  id: string;
  label: string;
  type?: string | null;
  domain?: string | null;
};

export type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  label?: string | null;
};

export type DigitalEnterpriseView = {
  projectId: string;
  view: DiagramViewKind;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  uploadedAt: string;
};

export type DigitalEnterpriseStats = {
  projectId: string;
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected: number;
};
