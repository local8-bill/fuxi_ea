"use server";

import { NextResponse } from "next/server";
import type { RoleReviewRun } from "@/lib/sequencer/types";
import { listRoleReviewRuns, persistRoleReviewRun } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RoleReviewRun;
    if (!isRoleReviewRun(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid role review payload" }, { status: 400 });
    }
    await persistRoleReviewRun(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save role review" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const runs = await listRoleReviewRuns(projectId);
    const filtered = sequenceId ? runs.filter((run) => run.sequenceId === sequenceId) : runs;
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch role reviews" }, { status: 500 });
  }
}

function isRoleReviewRun(value: unknown): value is RoleReviewRun {
  if (!value || typeof value !== "object") return false;
  const run = value as RoleReviewRun;
  if (!run.reviewId || !run.projectId || !run.sequenceId || !run.role || !run.createdAt) return false;
  if (!Array.isArray(run.findings)) return false;
  return true;
}
