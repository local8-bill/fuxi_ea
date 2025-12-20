"use server";

import { NextResponse } from "next/server";
import type { RoiFeasibilityReport } from "@/lib/roi/types";
import { listRoiFeasibilityReports, persistRoiFeasibilityReport } from "@/lib/roi/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RoiFeasibilityReport;
    if (!isRoiFeasibilityReport(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid ROI feasibility payload" }, { status: 400 });
    }
    await persistRoiFeasibilityReport(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save ROI feasibility report" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const records = await listRoiFeasibilityReports(projectId);
    const filtered = sequenceId ? records.filter((entry) => entry.sequenceId === sequenceId) : records;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch ROI feasibility reports" }, { status: 500 });
  }
}

function isRoiFeasibilityReport(value: unknown): value is RoiFeasibilityReport {
  if (!value || typeof value !== "object") return false;
  const report = value as RoiFeasibilityReport;
  if (!report.reportId || !report.projectId) return false;
  if (!report.generatedAt || !report.status) return false;
  if (!Array.isArray(report.constraints)) return false;
  return true;
}
