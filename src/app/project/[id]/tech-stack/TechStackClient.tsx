"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { FileUploadPanel } from "@/components/panels/FileUploadPanel";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card } from "@/components/ui/Card";
import {
  uploadLucidCsv,
  fetchDigitalEnterpriseStats,
} from "@/lib/api/digitalEnterprise";
import { parseInventoryCsv } from "@/domain/services/inventoryIngestion";
import { normalizeSystemName } from "@/domain/services/systemNormalization";
import { useTelemetry } from "@/hooks/useTelemetry";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
}

interface Props {
  projectId: string;
}

interface InventoryStatsLocal {
  projectId: string;
  rowCount: number;
  uniqueSystems: number;
}

interface DiagramSystem {
  id: string;
  name: string;
  normalizedName: string;
  integrationCount: number;
}

interface DiffStats {
  inventoryCount: number;
  diagramCount: number;
  overlapCount: number;
  inventoryOnlyNorms: string[];
  diagramOnly: DiagramSystem[];
  overlapSystems: DiagramSystem[];
}

interface ProjectIntake {
  projectId: string;
  industry: string | null;
  drivers: string[];
  aggression: string | null;
  constraints?: string[];
  untouchables?: string[];
  notes?: string | null;
}

interface TruthRow {
  norm: string;
  inventoryName: string | null;
  diagramName: string | null;
  recommended: string;
  confidence: number;
  note?: string;
}

interface TruthCandidate {
  norm: string;
  inventoryName: string | null;
  diagramNames: string[];
}

interface OverlapCluster {
  label: string;
  systems: string[];
}

function formatNumber(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "0";
  return n.toLocaleString();
}

function normalizeForCompare(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function categorizeSystem(name: string): string {
  const n = (name || "").toLowerCase();
  if (!n) return "Other / uncategorized";

  // Commerce / customer-facing
  if (
    n.includes("commerce") ||
    n.includes("ecom") ||
    n.includes("shopify") ||
    n.includes("salesforce commerce") ||
    n.includes("storefront")
  ) {
    return "Commerce & transactions";
  }

  // Product information / content
  if (
    n.includes("pim") ||
    n.includes("product information") ||
    n.includes("catalog") ||
    n.includes("pdp") ||
    n.includes("salsify")
  ) {
    return "Product information & content";
  }

  // Content & experience platforms
  if (
    n.includes("cms") ||
    n.includes("content") ||
    n.includes("coremedia") ||
    n.includes("sitecore") ||
    n.includes("contentful") ||
    n.includes("experience") ||
    n.includes("dxp")
  ) {
    return "Content & experience";
  }

  // Customer data / CDP / analytics
  if (
    n.includes("amperity") ||
    n.includes("segmentation") ||
    n.includes("cdp") ||
    n.includes("customer data") ||
    n.includes("profile") ||
    n.includes("audience") ||
    n.includes("analytics")
  ) {
    return "Customer data & insights";
  }

  // Messaging / martech
  if (
    n.includes("mailgun") ||
    n.includes("sendgrid") ||
    n.includes("twilio") ||
    n.includes("sms") ||
    n.includes("email") ||
    n.includes("attentive") ||
    n.includes("braze") ||
    n.includes("campaign") ||
    n.includes("journey")
  ) {
    return "Messaging & engagement";
  }

  // Integration / middleware
  if (
    n.includes("mulesoft") ||
    n.includes("boomi") ||
    n.includes("workato") ||
    n.includes("integration") ||
    n.includes("api gateway") ||
    n.includes("golden gate")
  ) {
    return "Integration / middleware";
  }

  // Data / warehouse / BI
  if (
    n.includes("snowflake") ||
    n.includes("redshift") ||
    n.includes("bigquery") ||
    n.includes("tableau") ||
    n.includes("powerbi") ||
    n.includes("lookr")
  ) {
    return "Data & BI";
  }

  return "Other / uncategorized";
}

function loadProjectIntake(projectId: string): ProjectIntake | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`fuxi:intake:${projectId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      projectId: String(parsed.projectId ?? projectId),
      industry: parsed.industry ?? null,
      drivers: Array.isArray(parsed.drivers)
        ? parsed.drivers.map((d: unknown) => String(d))
        : [],
      aggression: parsed.aggression ?? null,
      constraints: Array.isArray(parsed.constraints)
        ? parsed.constraints.map((c: unknown) => String(c))
        : [],
      untouchables: Array.isArray(parsed.untouchables)
        ? parsed.untouchables.map((u: unknown) => String(u))
        : [],
      notes: parsed.notes ?? null,
    };
  } catch (err) {
    console.warn("[TECH-STACK] Failed to load intake context", err);
    return null;
  }
}

export function TechStackClient({ projectId }: Props) {
  const telemetry = useTelemetry("tech_stack", { projectId });
  // Inventory / artifacts
  const [inventoryFileName, setInventoryFileName] = useState<string | null>(null);
  const [lucidFileName, setLucidFileName] = useState<string | null>(null);
  const [inventoryRows, setInventoryRows] = useState<number>(0);
  const [normalizedApps, setNormalizedApps] = useState<number>(0);
  const [invStats, setInvStats] = useState<InventoryStatsLocal | null>(null);
  const [uploadingInv, setUploadingInv] = useState<boolean>(false);
  const [invError, setInvError] = useState<string | null>(null);

  const artifactCount =
    (inventoryFileName ? 1 : 0) + (lucidFileName ? 1 : 0);

  const artifactDescription = (() => {
    const parts: string[] = [];
    if (inventoryFileName) parts.push(`Inventory: ${inventoryFileName}`);
    if (lucidFileName) parts.push(`Lucid: ${lucidFileName}`);
    if (parts.length === 0) {
      return "Inventory and diagram files in this project.";
    }
    return parts.join(" • ");
  })();

  // Digital Enterprise
  const [deStats, setDeStats] = useState<DigitalEnterpriseStats | null>(null);
  const [loadingDE, setLoadingDE] = useState<boolean>(true);
  const [uploadingLucid, setUploadingLucid] = useState<boolean>(false);
  const [deError, setDeError] = useState<string | null>(null);

  // Diff plumbing
  const [inventorySystemsNorm, setInventorySystemsNorm] = useState<string[]>([]);
  const [inventoryDisplayByNorm, setInventoryDisplayByNorm] = useState<
    Record<string, string>
  >({});
  const [diagramSystems, setDiagramSystems] = useState<DiagramSystem[]>([]);
  const [diffStats, setDiffStats] = useState<DiffStats | null>(null);
  const [diffError, setDiffError] = useState<string | null>(null);

  // Intake context (from /project/[id]/intake)
  const [intakeContext, setIntakeContext] = useState<ProjectIntake | null>(null);

  // Truth Pass (AI results)
  const [truthRows, setTruthRows] = useState<TruthRow[]>([]);
  const [truthLoading, setTruthLoading] = useState<boolean>(false);
  const [truthError, setTruthError] = useState<string | null>(null);

  const loadDEAndSystems = useCallback(async () => {
    telemetry.log("tech_stack_view", { projectId });
    setLoadingDE(true);
    setDeError(null);
    setDiffError(null);

    try {
      const started = performance.now();
      const stats = await fetchDigitalEnterpriseStats(projectId);
      setDeStats(stats ?? null);
      telemetry.log("tech_stack_stats", {
        systems: stats?.systemsFuture,
        integrations: stats?.integrationsFuture,
        domains: stats?.domainsDetected,
        duration_ms: Math.round(performance.now() - started),
      });
    } catch (err: any) {
      console.error("[TECH-STACK] Error loading digital enterprise stats", err);
      setDeError("Failed to load digital enterprise preview.");
      setDeStats(null);
      telemetry.log("tech_stack_stats_error", { message: (err as Error)?.message });
    } finally {
      setLoadingDE(false);
    }

    try {
      const res = await fetch(
        `/api/digital-enterprise/systems?project=${encodeURIComponent(
          projectId,
        )}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(
          "[TECH-STACK] Failed to load diagram systems for diff",
          res.status,
          text,
        );
        setDiffError("Failed to load diagram systems for diff view.");
        setDiagramSystems([]);
        telemetry.log("tech_stack_diff_error", { status: res.status, body: text });
      } else {
        const json = await res.json();
        if (json && Array.isArray(json.systems)) {
          const systems: DiagramSystem[] = json.systems.map((s: any) => ({
            id: String(s.id ?? s.name ?? s.normalizedName ?? "unknown"),
            name: String(s.name ?? "Unknown"),
            normalizedName: String(
              s.normalizedName ?? normalizeSystemName(s.name),
            ),
            integrationCount: Number(s.integrationCount ?? 0),
          }));
          setDiagramSystems(systems);
        } else {
          setDiagramSystems([]);
        }
        setDiffError(null);
      }
    } catch (err: any) {
      console.error("[TECH-STACK] Error fetching diagram systems for diff", err);
      setDiffError("Failed to load diagram systems for diff view.");
      setDiagramSystems([]);
    }
  }, [projectId, telemetry]);

  // Load intake + DE stats + diagram systems
  useEffect(() => {
    const ctx = loadProjectIntake(projectId);
    setIntakeContext(ctx);
    loadDEAndSystems();
  }, [projectId, loadDEAndSystems]);

  // Compute diff whenever inventory systems or diagram systems change
  useEffect(() => {
    const invNormSet = new Set(
      (inventorySystemsNorm ?? []).filter((n) => n && n.trim().length > 0),
    );
    const diagNormSet = new Set(
      (diagramSystems ?? [])
        .map((s) => s.normalizedName)
        .filter((n) => n && n.trim().length > 0),
    );

    if (invNormSet.size === 0 && diagNormSet.size === 0) {
      setDiffStats(null);
      return;
    }

    const inventoryOnlyNorms: string[] = [];
    const overlapNorms = new Set<string>();

    for (const norm of invNormSet) {
      if (diagNormSet.has(norm)) {
        overlapNorms.add(norm);
      } else {
        inventoryOnlyNorms.push(norm);
      }
    }

    const diagramOnly: DiagramSystem[] = [];
    const overlapSystems: DiagramSystem[] = [];

    for (const s of diagramSystems) {
      const norm = s.normalizedName;
      if (!norm) continue;
      if (invNormSet.has(norm)) {
        overlapSystems.push(s);
      } else {
        diagramOnly.push(s);
      }
    }

    const diff: DiffStats = {
      inventoryCount: invNormSet.size,
      diagramCount: diagNormSet.size,
      overlapCount: overlapNorms.size,
      inventoryOnlyNorms,
      diagramOnly,
      overlapSystems,
    };

    setDiffStats(diff);
  }, [inventorySystemsNorm, diagramSystems]);

  function buildTruthCandidates(): TruthCandidate[] {
    if (!diffStats) return [];

    const candidates: TruthCandidate[] = [];
    const seen = new Set<string>();

    // Overlap norms (present in both)
    if (diffStats.overlapSystems.length > 0) {
      const byNorm = new Map<
        string,
        { invName: string | null; diagNames: string[] }
      >();

      for (const s of diffStats.overlapSystems) {
        const norm = s.normalizedName;
        if (!norm) continue;
        const current = byNorm.get(norm) ?? {
          invName: inventoryDisplayByNorm[norm] ?? null,
          diagNames: [],
        };
        current.diagNames.push(s.name);
        byNorm.set(norm, current);
      }

      for (const [norm, payload] of byNorm.entries()) {
        candidates.push({
          norm,
          inventoryName: payload.invName,
          diagramNames: payload.diagNames,
        });
        seen.add(norm);
      }
    }

    // Inventory-only also through AI pass
    for (const norm of diffStats.inventoryOnlyNorms) {
      if (seen.has(norm)) continue;
      candidates.push({
        norm,
        inventoryName: inventoryDisplayByNorm[norm] ?? null,
        diagramNames: [],
      });
    }

    return candidates.slice(0, 50);
  }

  async function runTruthPass(candidates: TruthCandidate[]) {
    if (!candidates.length) {
      setTruthRows([]);
      return;
    }

    setTruthLoading(true);
    setTruthError(null);

    try {
      const res = await fetch("/api/truth-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          intakeContext,
          candidates,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[TRUTH-PASS] API error", res.status, text);
        setTruthError(
          "AI suggestions are temporarily unavailable. Showing nothing for now.",
        );
        setTruthRows([]);
        return;
      }

      const json = await res.json();
      if (!json || !Array.isArray(json.rows)) {
        console.error("[TRUTH-PASS] Unexpected response shape", json);
        setTruthError(
          "AI suggestions returned an unexpected format. Showing nothing for now.",
        );
        setTruthRows([]);
        return;
      }

      setTruthRows(json.rows as TruthRow[]);
    } catch (err) {
      console.error("[TRUTH-PASS] Network / runtime error", err);
      setTruthError(
        "AI suggestions hit a network error. Try refreshing or running again.",
      );
      setTruthRows([]);
    } finally {
      setTruthLoading(false);
    }
  }

  // Kick AI when diff changes
  useEffect(() => {
    if (!diffStats) {
      setTruthRows([]);
      return;
    }

    const candidates = buildTruthCandidates();
    if (!candidates.length) {
      setTruthRows([]);
      return;
    }

    void runTruthPass(candidates);
  }, [diffStats, inventoryDisplayByNorm, diagramSystems, projectId, intakeContext]);

  const normalizeName = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  // Overlap clusters derived from Truth Pass
  const overlapClusters: OverlapCluster[] = (() => {
    if (!truthRows || truthRows.length === 0) return [];

    const buckets = new Map<string, Set<string>>();

    for (const row of truthRows) {
      const names: string[] = [];
      const inv = normalizeName((row as any).inventoryName);
      const diagram = normalizeName((row as any).diagramName);
      const rec = normalizeName((row as any).recommended);
      const norm = normalizeName((row as any).norm);

      if (inv) names.push(inv);
      if (diagram) names.push(diagram);
      if (!names.length && rec) names.push(rec);
      if (!names.length && norm) names.push(norm);

      for (const name of names) {
        const lane = categorizeSystem(name);
        const set = buckets.get(lane) ?? new Set<string>();
        set.add(name);
        buckets.set(lane, set);
      }
    }

    return Array.from(buckets.entries())
      .map(([label, set]) => ({
        label,
        systems: Array.from(set).sort(),
      }))
      .filter((cluster) => cluster.systems.length > 1);
  })();

  // Inventory upload
  async function handleInventoryUpload(file: File) {
    setInventoryFileName(file.name);
    setUploadingInv(true);
    setInvError(null);

    try {
      console.log("[TECH-STACK] Inventory upload started", {
        projectId,
        fileName: file.name,
      });

      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error(
          "Unsupported file type. Please export your Excel inventory as CSV and upload the .csv file.",
        );
      }

      const text = await file.text();
      const parsed = parseInventoryCsv(text);

      const stats: InventoryStatsLocal = {
        projectId,
        rowCount: parsed.rows.length,
        uniqueSystems: parsed.uniqueSystems,
      };

      setInvStats(stats);
      setInventoryRows(stats.rowCount);
      setNormalizedApps(stats.uniqueSystems);

      const normSet = new Set<string>();
      const displayMap: Record<string, string> = {};
      for (const item of parsed.rows) {
        const displayName = item.systemName || "";
        const norm = normalizeSystemName(displayName);
        if (!norm) continue;
        normSet.add(norm);
        if (!displayMap[norm] && displayName) {
          displayMap[norm] = displayName;
        }
      }
      setInventorySystemsNorm(Array.from(normSet));
      setInventoryDisplayByNorm(displayMap);

      console.log("[TECH-STACK] Inventory parsed locally", {
        rowCount: stats.rowCount,
        uniqueSystems: stats.uniqueSystems,
      });
    } catch (err: any) {
      console.error("[TECH-STACK] Inventory upload failed (client parse)", err);
      setInvError(err?.message ?? "Inventory upload failed.");
      setInventorySystemsNorm([]);
      setInventoryDisplayByNorm({});
    } finally {
      setUploadingInv(false);
    }
  }

  // Lucid upload
  async function handleLucidUpload(file: File) {
    setLucidFileName(file.name);
    setUploadingLucid(true);
    setDeError(null);
    setDiffError(null);

    try {
      const resp = await uploadLucidCsv(projectId, file);
      console.log("[TECH-STACK] Lucid upload success", resp);

      const stats = await fetchDigitalEnterpriseStats(projectId);
      if (stats) {
        setDeStats(stats);
      }

      try {
        const res = await fetch(
          `/api/digital-enterprise/systems?project=${encodeURIComponent(
            projectId,
          )}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.systems)) {
            const systems: DiagramSystem[] = json.systems.map((s: any) => ({
              id: String(s.id ?? s.name ?? s.normalizedName ?? "unknown"),
              name: String(s.name ?? "Unknown"),
              normalizedName: String(
                s.normalizedName ?? normalizeSystemName(s.name),
              ),
              integrationCount: Number(s.integrationCount ?? 0),
            }));
            setDiagramSystems(systems);
          } else {
            setDiagramSystems([]);
          }
        } else {
          const text = await res.text().catch(() => "");
          console.error(
            "[TECH-STACK] Failed to refresh diagram systems after Lucid upload",
            res.status,
            text,
          );
        }
      } catch (err: any) {
        console.error(
          "[TECH-STACK] Error refreshing diagram systems after Lucid upload",
          err,
        );
      }
    } catch (err: any) {
      console.error("[TECH-STACK] Lucid upload failed", err);
      setDeError(err?.message ?? "Lucid upload failed.");
    } finally {
      setUploadingLucid(false);
    }
  }

  const hasDE =
    !!deStats &&
    ((deStats.systemsFuture ?? 0) > 0 ||
      (deStats.integrationsFuture ?? 0) > 0);


  const visibleOverlapClusters = overlapClusters.filter(
    (c) => c.label !== "Other / uncategorized"
  );

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <WorkspaceHeader
        statusLabel="STATUS"
        title="Tech Stack Workspace"
        description="Upload inventories, diagrams, and Lucid exports to understand your applications, integrations, and dependencies."
      />
      {(deError || diffError) && (
        <div className="space-y-2">
          {deError && <ErrorBanner message={deError} onRetry={loadDEAndSystems} />}
          {diffError && !deError && <ErrorBanner message={diffError} onRetry={loadDEAndSystems} />}
        </div>
      )}

      {/* Inputs description */}
      <Card className="mb-4">
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
          INPUTS
        </p>
        <p className="text-xs text-gray-500">
          Upload artifacts to build a live view of your digital enterprise for
          project{" "}
          <span className="font-medium">{projectId}</span>.
        </p>
      </Card>

      {/* Project context / navigation – pulled from Intake */}
      <Card className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
              PROJECT CONTEXT
            </p>
            {intakeContext ? (
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {intakeContext.industry || "Industry not set"}
                </span>{" "}
                · Goal:{" "}
                <span className="font-medium">
                  {intakeContext.drivers.length
                    ? intakeContext.drivers.join(", ")
                    : "No primary drivers yet"}
                </span>{" "}
                · Posture:{" "}
                <span className="font-medium">
                  {intakeContext.aggression || "Not set"}
                </span>
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                No intake answers loaded yet. Start in the Intake workspace to
                set goals and constraints for this project.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = `/project/${projectId}/intake`;
                }
              }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[0.7rem] font-medium text-slate-700 hover:bg-slate-50"
            >
              Intake
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = `/project/${projectId}/portfolio`;
                }
              }}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-[0.7rem] font-semibold text-white hover:bg-slate-800"
            >
              Portfolio view
            </button>
          </div>
        </div>
      </Card>

      {/* Upload panels */}
      <FileUploadPanel
        title="UPLOAD INVENTORY SPREADSHEET"
        helper="Export your technology inventory from Excel as CSV and upload it here. We'll parse systems and normalize them for comparison."
        label={uploadingInv ? "Uploading..." : "Upload Inventory CSV"}
        onFileSelected={handleInventoryUpload}
        className="mb-4"
      />

      <FileUploadPanel
        title="UPLOAD LUCID CSV"
        helper="Upload a Lucid CSV export of your architecture diagram. We'll infer systems and integrations automatically and update the Digital Enterprise metrics."
        label={uploadingLucid ? "Uploading..." : "Upload Lucid CSV"}
        onFileSelected={handleLucidUpload}
      />

      {/* Inventory / artifact metrics */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <MetricCard
          label="ARTIFACTS"
          value={formatNumber(artifactCount)}
          description={artifactDescription}
        />
        <MetricCard
          label="INVENTORY ROWS"
          value={formatNumber(inventoryRows)}
          description="Application rows ingested from spreadsheets."
        />
        <MetricCard
          label="NORMALIZED APPS"
          value={formatNumber(normalizedApps)}
          description="Systems clustered into canonical applications from inventory."
        />
      </div>

      {invError && (
        <div className="mb-4 text-xs text-red-500">{invError}</div>
      )}

      {/* Digital Enterprise preview */}
      <Card className="mb-8">
        <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-1 uppercase">
          DIGITAL ENTERPRISE PREVIEW
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Derived from your Lucid architecture diagram. Systems and integrations
          here represent the structural view of your ecosystem.
        </p>
        {loadingDE && (
          <div className="text-sm text-gray-500">
            Loading Digital Enterprise preview...
          </div>
        )}
        {!loadingDE && deError && (
          <div className="text-sm text-red-500">{deError}</div>
        )}
        {!loadingDE && !deError && hasDE && deStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="SYSTEMS"
              value={formatNumber(deStats.systemsFuture)}
              description="Unique labeled systems in this diagram."
            />
            <MetricCard
              label="INTEGRATIONS"
              value={formatNumber(deStats.integrationsFuture)}
              description="System-to-system connections from Lucid connector lines."
            />
            <MetricCard
              label="DOMAINS DETECTED"
              value={formatNumber(deStats.domainsDetected ?? 0)}
              description="Domain clustering will be introduced in a later iteration."
            />
          </div>
        )}
        {!loadingDE && !deError && !hasDE && (
          <div className="text-sm text-gray-500">
            No Digital Enterprise metrics yet. Upload a Lucid CSV to populate this
            preview.
          </div>
        )}
      </Card>

      {/* TRUTH PASS – AI suggestions */}
      <Card className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">
            TRUTH PASS · AI SUGGESTIONS
          </p>
          <span
            className={
              truthLoading
                ? "inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold text-emerald-700 animate-pulse"
                : "inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold text-slate-50"
            }
            title={
              truthLoading
                ? "Fuxi is scanning your current artifacts to suggest canonical system names."
                : "These rows are powered by Fuxi's AI pass across your current inventory and Lucid diagram."
            }
          >
            {truthLoading ? "Fuxi is thinking…" : "AI Powered"}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Fuxi compares your inventory and Lucid diagram for project{" "}
          <span className="font-medium">{projectId}</span>{" "}
          and suggests a canonical system name with a confidence rating. Use this as a
          sanity check before you trust the diff.
        </p>

        {truthError && (
          <p className="mb-3 text-[0.75rem] text-red-500">{truthError}</p>
        )}
        {truthLoading && !truthError && (
          <p className="mb-3 text-[0.75rem] text-emerald-700">
            Running AI over your current inventory and Lucid systems…
          </p>
        )}

        {truthRows.length === 0 && !truthLoading && !truthError && (
          <p className="text-xs text-gray-500">
            Once you upload both an inventory CSV and a Lucid CSV, Fuxi will run a
            Truth Pass to suggest canonical system names.
          </p>
        )}

        {truthRows.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-4 py-2 text-[0.65rem] tracking-[0.22em] text-gray-500 uppercase bg-slate-50">
              <span>Inventory</span>
              <span>Diagram</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-gray-100">
              {truthRows.map((row, i) => {
                const inventoryLabel =
                  row.inventoryName && typeof row.inventoryName === "string" && row.inventoryName.trim().length > 0
                    ? row.inventoryName
                    : "Not in inventory";
                const diagramLabel =
                  row.diagramName && typeof row.diagramName === "string" && row.diagramName.trim().length > 0
                    ? row.diagramName
                    : "Not in diagram";
                const recommendedName =
                  row.recommended && row.recommended.trim().length > 0
                    ? row.recommended
                    : inventoryLabel !== "Not in inventory"
                    ? inventoryLabel
                    : diagramLabel;

                const invMatches =
                  inventoryLabel !== "Not in inventory" &&
                  normalizeForCompare(inventoryLabel) ===
                    normalizeForCompare(recommendedName);
                const diagMatches =
                  diagramLabel !== "Not in diagram" &&
                  normalizeForCompare(diagramLabel) ===
                    normalizeForCompare(recommendedName);

                const inventoryRecommended = invMatches;
                const diagramRecommended = !invMatches && diagMatches;

                return (
                  <div
                    key={row.norm ?? i}
                    className="grid grid-cols-3 gap-4 px-4 py-3 text-sm items-center"
                  >
                    {/* Inventory column */}
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          inventoryRecommended
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-500"
                        }
                      >
                        {inventoryLabel}
                      </span>
                      {inventoryRecommended && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
                          Recommended
                        </span>
                      )}
                    </div>

                    {/* Diagram column */}
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          diagramRecommended
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-500"
                        }
                      >
                        {diagramLabel}
                      </span>
                      {diagramRecommended && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
                          Recommended
                        </span>
                      )}
                    </div>

                    {/* Confidence + actions */}
                    <div className="flex flex-col items-end justify-center gap-1 text-right">
                      <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-medium text-white">
                        {Math.round(row.confidence ?? 70)}%
                      </span>
                      <div className="flex gap-2 text-[0.7rem]">
                        <button className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                          Keep
                        </button>
                        <button className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
                          Edit
                        </button>
                        <button className="px-2.5 py-1 rounded-md bg-gray-100 text-red-600 hover:bg-gray-200">
                          Delete
                        </button>
                      </div>
                      <span
                        className="text-[0.65rem] text-slate-500"
                        title={row.note ?? undefined}
                      >
                        AI:{" "}
                        {row.note ??
                          "Suggestion based on your current artifacts."}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[0.7rem] text-slate-500">
              Preview only — AI suggestions and decisions are not yet saved.
            </div>
          </div>
        )}
      </Card>

      {/* OVERLAP LENS – where you have multiple tools in the same lane */}
      <Card className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 uppercase">
            OVERLAP LENS
          </p>
          {truthLoading ? (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[0.7rem] font-semibold text-amber-800">
              Updating with latest AI pass…
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[0.7rem] font-semibold text-slate-50">
              {visibleOverlapClusters.length > 0
                ? `${visibleOverlapClusters.length} overlap areas`
                : "No clear overlaps yet"}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-3">
          Fuxi looks at your Truth Pass matches and highlights areas where you are
          running multiple tools in the same lane. Use this as a starting point
          for portfolio simplification, not a mandate.
        </p>

        {truthError && (
          <p className="mb-2 text-[0.75rem] text-red-500">
            {truthError}
          </p>
        )}

        {!truthLoading && visibleOverlapClusters.length === 0 && !truthError && (
          <p className="text-xs text-gray-500">
            Once you have a few Truth Pass rows, Fuxi will surface overlapping
            areas here.
          </p>
        )}

        {visibleOverlapClusters.length > 0 && (
          <div className="space-y-3">
            {visibleOverlapClusters.map((cluster, idx) => (
              <div
                key={cluster.label + idx}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[0.75rem] font-semibold text-slate-800">
                    {cluster.label}
                  </p>
                  <span className="text-[0.65rem] text-slate-500">
                    {cluster.systems.length} systems
                  </span>
                </div>
                <p className="text-[0.7rem] text-slate-600">
                  {cluster.systems.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
