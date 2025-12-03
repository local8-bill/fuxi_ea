import { NextRequest, NextResponse } from "next/server";
import { getStatsForProject } from "@/domain/services/digitalEnterpriseStore";
import { createRateLimiter, requireAuth, jsonError } from "@/lib/api/security";
import path from "node:path";
import { readFileSync } from "node:fs";

export const runtime = "nodejs";

const rateLimit = createRateLimiter({ windowMs: 60_000, max: 60, name: "de-stats" });
const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const HARMONIZED_GRAPH = path.join(DATA_ROOT, "harmonized", "enterprise_graph.json");

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth) return auth;

  const limited = rateLimit(req);
  if (limited) return limited;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("project") ?? "default";

  console.log("[DE-STATS] GET start", { projectId });

  try {
    let harmonizedCounts: { nodes: number; edges: number; domains: number } | null = null;
    try {
      const raw = readFileSync(HARMONIZED_GRAPH, "utf8");
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed?.nodes) ? parsed.nodes : [];
      const edges = Array.isArray(parsed?.edges) ? parsed.edges : [];
      const domains = new Set<string>();
      nodes.forEach((n: any) => {
        if (n?.domain) domains.add(String(n.domain));
      });
      harmonizedCounts = { nodes: nodes.length, edges: edges.length, domains: domains.size };
    } catch (err) {
      console.warn("[DE-STATS] harmonized graph read failed, falling back to store", { err: (err as any)?.message });
    }

    const stats = await getStatsForProject(projectId);
    const systemsFuture = harmonizedCounts?.nodes ?? stats.systemsFuture;
    const integrationsFuture = harmonizedCounts?.edges ?? stats.integrationsFuture;
    const domainsDetected = harmonizedCounts?.domains ?? stats.domainsDetected ?? 0;

    console.log("[DE-STATS] GET success", {
      projectId,
      systemsFuture,
      integrationsFuture,
      domainsDetected,
      topSystems: stats.topSystems?.length ?? 0,
    });

    return NextResponse.json(
      {
        ...stats,
        systemsFuture,
        integrationsFuture,
        domainsDetected,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[DE-STATS] GET error", {
      projectId,
      message: err?.message ?? String(err),
      stack: err?.stack,
    });

    return jsonError(
      500,
      "Failed to compute digital enterprise stats",
      err?.message ?? "Unknown error",
    );
  }
}
