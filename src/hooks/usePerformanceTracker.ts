"use client";

import { useEffect } from "react";

export function usePerformanceTracker(label: string) {
  const start = performance.now();

  useEffect(() => {
    const end = performance.now();
    const delta = (end - start).toFixed(2);
    console.log(`[perf] ${label} mounted in ${delta}ms`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
