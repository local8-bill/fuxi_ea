"use client";

import React from "react";
import { v4 as uuidv4 } from "uuid";

type TelemetryOptions = {
  projectId?: string;
  debug?: boolean;
};

type TelemetryPayload = {
  session_id: string;
  project_id?: string;
  workspace_id: string;
  event_type: string;
  timestamp: string;
  data?: Record<string, unknown>;
  simplification_score?: number;
};

const SESSION_KEY = "fuxi:session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = uuidv4();
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

async function postTelemetry(payload: TelemetryPayload, debug: boolean) {
  if (debug) {
    // eslint-disable-next-line no-console
    console.info("[telemetry] sending", payload);
  }
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    if (debug) {
      // eslint-disable-next-line no-console
      console.warn("[telemetry] failed to send", err);
    }
  }
}

export function useTelemetry(workspaceId: string, opts?: TelemetryOptions) {
  const debug =
    opts?.debug ?? (typeof window !== "undefined" && process.env.NEXT_PUBLIC_TELEMETRY_DEBUG === "true");
  const sessionId = React.useMemo(() => getSessionId(), []);
  const firedOnce = React.useRef<Set<string>>(new Set());

  const log = React.useCallback(
    (eventType: string, data?: Record<string, unknown>, simplificationScore?: number) => {
      if (eventType === "workspace_view") {
        const key = `${workspaceId}:${sessionId}:${eventType}`;
        if (firedOnce.current.has(key)) return;
        firedOnce.current.add(key);
      }
      const payload: TelemetryPayload = {
        session_id: sessionId,
        project_id: opts?.projectId,
        workspace_id: workspaceId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        data,
        simplification_score: simplificationScore,
      };
      postTelemetry(payload, debug);
    },
    [sessionId, workspaceId, opts?.projectId, debug],
  );

  return { log, sessionId, debug };
}
