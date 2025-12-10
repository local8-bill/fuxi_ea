// dx Live Graph Monitor
// Validates graph payloads coming from the digital-enterprise API and prints
// a concise integrity report to the console for dx to review.

type GraphNode = {
  id: string;
  label?: string;
  domain?: string;
};

type GraphEdge = {
  id?: string;
  source?: string;
  target?: string;
};

type GraphPayload = {
  source?: string;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
};

export function monitorGraphData(payload: GraphPayload | null | undefined) {
  if (!payload || !Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) {
    console.warn("⚠️ dx: No graph data received.");
    return;
  }

  if (payload.source === "api") {
    console.log("🧠 dx: Read-only mode active (API data). No writes permitted.");
  }

  const nodes = payload.nodes;
  const edges = payload.edges;

  const domainSet = new Set<string>();
  nodes.forEach((node) => {
    if (node.domain) domainSet.add(node.domain);
  });

  const orphanNodes = nodes.filter((node) => !edges.some((edge) => edge.source === node.id || edge.target === node.id));

  console.groupCollapsed("📊 dx: Graph Integrity Report");
  console.log(`🌐 Total Nodes: ${nodes.length}`);
  console.log(`🔗 Total Edges: ${edges.length}`);
  console.log(`🗂️ Domains: ${domainSet.size ? Array.from(domainSet).join(", ") : "None detected"}`);
  console.log(`🧩 Orphan Nodes: ${orphanNodes.length}`);
  if (orphanNodes.length) {
    console.table(orphanNodes.map((node) => ({ id: node.id, label: node.label ?? "(no label)" })));
    console.warn("🔍 dx: Potential missing integrations detected.");
  } else {
    console.log("✅ dx Graph Health Verified (read-only)");
  }
  console.groupEnd();
}

export async function verifyLatestBackup(): Promise<boolean> {
  if (typeof window === "undefined") {
    const { verifyLatestBackupOnServer } = await import("./liveMonitorServer");
    return verifyLatestBackupOnServer();
  }

  try {
    const response = await fetch("/api/dx/verify-backup", { cache: "no-store" });
    if (!response.ok) {
      console.warn(`⚠️ dx: Backup verification API returned ${response.status}`);
      return false;
    }
    const payload = await response.json();
    if (payload?.ok) {
      console.log(payload.message);
      return true;
    }
    console.warn(payload?.message ?? "⚠️ dx: Backup verification failed.");
    return false;
  } catch (error) {
    console.warn("⚠️ dx: Unable to verify backup via API.", error);
    return false;
  }
}
