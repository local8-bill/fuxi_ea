export type DigitalEnterpriseItemKind = "system" | "integration";

export type DigitalEnterpriseItem = {
  projectId: string;
  kind: DigitalEnterpriseItemKind;
  id: string;
  label: string;
  sourceId?: string;
  targetId?: string;
};

export type DigitalEnterpriseStats = {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected: number;
};

const lucidStore = new Map<string, DigitalEnterpriseItem[]>();

export function saveLucidItemsForProject(
  projectId: string,
  items: DigitalEnterpriseItem[],
): void {
  lucidStore.set(projectId, items);
}

export function getLucidItemsForProject(
  projectId: string,
): DigitalEnterpriseItem[] {
  return lucidStore.get(projectId) ?? [];
}

export function getStatsForProject(projectId: string): DigitalEnterpriseStats {
  const items = lucidStore.get(projectId) ?? [];

  const systemIds = new Set<string>();
  const integrationIds = new Set<string>();

  for (const item of items) {
    if (item.kind === "system") {
      systemIds.add(item.id);
    } else if (item.kind === "integration") {
      integrationIds.add(item.id);
    }
  }

  return {
    systemsFuture: systemIds.size,
    integrationsFuture: integrationIds.size,
    // we’ll evolve this into real clustering later
    domainsDetected: 0,
  };
}
