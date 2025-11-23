import { NextResponse } from "next/server";

interface DiagramSystem {
  id: string;
  name: string;
  normalizedName: string;
  integrationCount: number;
}

interface IntakeContext {
  projectId: string;
  industry: string | null;
  drivers: string[];
  aggression: string | null;
}

function categorizeSystem(name: string): string {
  const n = (name || "").toLowerCase();

  if (!n) return "Other / uncategorized";

  if (n.includes("pim") || n.includes("product information") || n.includes("catalog")) {
    return "Product information & content";
  }

  if (
    n.includes("cms") ||
    n.includes("content") ||
    n.includes("coremedia") ||
    n.includes("sitecore") ||
    n.includes("contentful")
  ) {
    return "Content & experience";
  }

  if (
    n.includes("amperity") ||
    n.includes("segmentation") ||
    n.includes("cdp") ||
    n.includes("customer data") ||
    n.includes("profile")
  ) {
    return "Customer data & insights";
  }

  if (
    n.includes("mailgun") ||
    n.includes("sendgrid") ||
    n.includes("twilio") ||
    n.includes("sms") ||
    n.includes("email") ||
    n.includes("attentive")
  ) {
    return "Messaging & notifications";
  }

  if (
    n.includes("commerce") ||
    n.includes("ecom") ||
    n.includes("shopify") ||
    n.includes("salesforce commerce")
  ) {
    return "Commerce & transactions";
  }

  return "Other / uncategorized";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    const intakeContext = (body.intakeContext ?? null) as IntakeContext | null;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing projectId" },
        { status: 400 },
      );
    }

    // Pull diagram systems
    const systemsUrl = new URL(
      `/api/digital-enterprise/systems?project=${encodeURIComponent(projectId)}`,
      req.url,
    );

    const systemsRes = await fetch(systemsUrl.toString(), {
      cache: "no-store",
    });

    if (!systemsRes.ok) {
      const text = await systemsRes.text().catch(() => "");
      console.error("[PORTFOLIO] Failed to load diagram systems", systemsRes.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load diagram systems for portfolio optimizer.",
          status: "error",
          message: "Diagram systems could not be loaded.",
        },
        { status: 500 },
      );
    }

    const systemsJson = await systemsRes.json().catch(() => ({} as any));
    const rawSystems: any[] = Array.isArray(systemsJson.systems)
      ? systemsJson.systems
      : [];

    const systems: DiagramSystem[] = rawSystems.map((s, idx) => ({
      id: String(s.id ?? s.name ?? s.normalizedName ?? `sys-${idx}`),
      name: String(s.name ?? "Unknown"),
      normalizedName: String(s.normalizedName ?? s.name ?? "Unknown"),
      integrationCount: Number(s.integrationCount ?? 0),
    }));

    // Group by category / lane
    const laneMap = new Map<
      string,
      {
        label: string;
        systems: DiagramSystem[];
      }
    >();

    for (const sys of systems) {
      const lane = categorizeSystem(sys.name || sys.normalizedName);
      const existing = laneMap.get(lane) ?? { label: lane, systems: [] };
      existing.systems.push(sys);
      laneMap.set(lane, existing);
    }

    const lanes = Array.from(laneMap.values()).map((lane) => {
      const totalIntegrations = lane.systems.reduce(
        (sum, s) => sum + (s.integrationCount || 0),
        0,
      );

      const overlap = lane.systems.length > 1;

      return {
        label: lane.label,
        systemCount: lane.systems.length,
        totalIntegrations,
        overlap,
        systems: lane.systems.map((s) => ({
          id: s.id,
          name: s.name,
          normalizedName: s.normalizedName,
          integrationCount: s.integrationCount,
        })),
      };
    });

    const overlapLanes = lanes.filter((l) => l.overlap);

    // Build simplification opportunities
    const opportunities: any[] = [];

    for (const lane of overlapLanes) {
      opportunities.push({
        id: `overlap:${lane.label}`,
        type: "simplification",
        lane: lane.label,
        systems: lane.systems.map((s: any) => s.name),
        summary: `You are running ${lane.systemCount} systems in the "${lane.label}" lane. Consider standardizing on 1–2 strategic platforms.`,
        heuristic: {
          systemCount: lane.systemCount,
          totalIntegrations: lane.totalIntegrations,
        },
      });
    }

    // High-level summary
    const summary = {
      totalSystems: systems.length,
      totalLanes: lanes.length,
      overlapLaneCount: overlapLanes.length,
      hasOverlaps: overlapLanes.length > 0,
    };

    const response = {
      ok: true,
      status: "ok",
      message: "Portfolio Optimizer engine stub executed with real lane & overlap analysis.",
      projectId,
      intakeContext,
      summary,
      lanes,
      opportunities,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[PORTFOLIO RUN] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        error: err?.message ?? "Failed to run optimizer.",
      },
      { status: 500 },
    );
  }
}
