"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const ROUTE_CONTEXT_KEY = "uxshell:route_context";

export type RouteContextPayload = {
  from?: string;
  targetView?: string;
  suggestionId?: string;
  intent?: string;
};

export function pushWithContext(router: AppRouterInstance, href: string, context: RouteContextPayload = {}) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      ROUTE_CONTEXT_KEY,
      JSON.stringify({
        ...context,
        href,
        ts: Date.now(),
      }),
    );
  }
  try {
    router.push(href);
  } catch {
    // ignore push failures; fall back to hard navigation
  }
  if (typeof window !== "undefined") {
    window.location.href = href;
  }
}

export function readRouteContext() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(ROUTE_CONTEXT_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(ROUTE_CONTEXT_KEY);
  try {
    return JSON.parse(raw) as RouteContextPayload & { href?: string; ts?: number };
  } catch {
    return null;
  }
}
