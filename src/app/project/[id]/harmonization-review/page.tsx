import fs from "node:fs/promises";
import path from "node:path";
import type { ReactElement } from "react";
import type { HarmonizedGraph } from "@/domain/services/harmonization";
import { HarmonizationReviewClient, type ReviewMetrics, type DeltaRow } from "./HarmonizationReviewClient";

// Next 16: params is a Promise and must be awaited.
interface PageProps {
  params: Promise<{ id: string }>;
}

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const HARMONIZED_FILE = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

function normalizeDomainValue(d?: string | null): string {
  const v = (d || "Other").toString().trim().toLowerCase();
  if (v.includes("commerce") || v.includes("omni") || v.includes("order") || v.includes("cart")) return "Commerce";
  if (v.includes("order management")) return "Order Management";
  if (v.includes("erp") || v.includes("sap") || v.includes("oracle") || v.includes("finance")) return "ERP";
  if (v.includes("crm") || v.includes("salesforce") || v.includes("customer")) return "CRM";
  if (v.includes("data") || v.includes("lake") || v.includes("warehouse")) return "Data";
  if (v.includes("integration") || v.includes("api") || v.includes("connector") || v.includes("mulesoft") || v.includes("boomi"))
    return "Integration";
  if (v.includes("hr") || v.includes("people") || v.includes("workday")) return "HR";
  if (v.includes("logistics") || v.includes("supply")) return "Logistics";
  if (v.includes("core") || v.includes("platform")) return "Core Platform";
  if (v.includes("billing")) return "Finance";
  return "Other";
}

async function readHarmonizedGraph(): Promise<HarmonizedGraph | null> {
  try {
    const raw = await fs.readFile(HARMONIZED_FILE, "utf8");
    return JSON.parse(raw) as HarmonizedGraph;
  } catch {
    return null;
  }
}

function buildMetrics(graph: HarmonizedGraph): { metrics: ReviewMetrics; deltaRows: DeltaRow[] } {
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  const stateCounts = nodes.reduce(
    (acc, n) => {
      acc[n.state] = (acc[n.state] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const domainCounts = nodes.reduce(
    (acc, n) => {
      const domain = normalizeDomainValue(n.domain);
      acc[domain] = (acc[domain] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const avgConfidence =
    nodes.reduce((sum, n) => sum + (n.confidence ?? 0), 0) / Math.max(1, nodes.length);

  const deltaRows: DeltaRow[] = nodes
    .filter((n) => n.state !== "unchanged")
    .map((n) => ({
      id: n.id,
      label: n.label,
      domain: normalizeDomainValue(n.domain),
      state: n.state,
      confidence: n.confidence ?? 0,
      sources: n.source_origin ?? [],
    }));

  const metrics: ReviewMetrics = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    avgConfidence: Number(avgConfidence.toFixed(3)),
    added: stateCounts.added ?? 0,
    removed: stateCounts.removed ?? 0,
    modified: stateCounts.modified ?? 0,
    domains: Object.entries(domainCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };

  return { metrics, deltaRows };
}

export default async function HarmonizationReviewPage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "";

  const graph = await readHarmonizedGraph();
  if (!graph || !graph.nodes?.length) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Harmonization Review</h1>
        <p className="mt-3 text-slate-600">
          No harmonized data is available yet. Drop Lucid and inventory files on Tech Stack, then re-run harmonization.
        </p>
      </div>
    );
  }

  const { metrics, deltaRows } = buildMetrics(graph);

  return (
    <HarmonizationReviewClient
      projectId={projectId}
      metrics={metrics}
      deltaRows={deltaRows}
    />
  );
}
