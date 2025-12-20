"use server";

import { NextResponse } from "next/server";
import type { RoleReviewFeedback } from "@/lib/sequencer/types";
import { listRoleReviewFeedback, persistRoleReviewFeedback } from "@/lib/sequencer/storage";

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as RoleReviewFeedback;
    if (!isRoleReviewFeedback(payload)) {
      return NextResponse.json({ ok: false, error: "Invalid role review feedback payload" }, { status: 400 });
    }
    await persistRoleReviewFeedback(payload);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to save role review feedback" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? undefined;
    const sequenceId = searchParams.get("sequenceId") ?? undefined;
    const reviewId = searchParams.get("reviewId") ?? undefined;
    const feedback = await listRoleReviewFeedback(projectId);
    const filtered = feedback.filter((entry) => {
      if (sequenceId && entry.sequenceId !== sequenceId) return false;
      if (reviewId && entry.reviewId !== reviewId) return false;
      return true;
    });
    return NextResponse.json({ ok: true, records: filtered });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Unable to fetch role review feedback" }, { status: 500 });
  }
}

function isRoleReviewFeedback(value: unknown): value is RoleReviewFeedback {
  if (!value || typeof value !== "object") return false;
  const feedback = value as RoleReviewFeedback;
  if (!feedback.feedbackId || !feedback.projectId || !feedback.sequenceId) return false;
  if (!feedback.reviewId || !feedback.findingId || !feedback.action || !feedback.authoredBy || !feedback.createdAt) return false;
  return true;
}
