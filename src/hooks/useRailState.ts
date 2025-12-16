"use client";

import { useCallback, useState } from "react";

interface RailStateOptions {
  left?: boolean;
  right?: boolean;
}

export function useRailState(initial?: RailStateOptions) {
  const [leftCollapsed, setLeftCollapsed] = useState(Boolean(initial?.left));
  const [rightCollapsed, setRightCollapsed] = useState(Boolean(initial?.right));

  const toggleLeft = useCallback(() => {
    setLeftCollapsed((prev) => !prev);
  }, []);

  const toggleRight = useCallback(() => {
    setRightCollapsed((prev) => !prev);
  }, []);

  return {
    leftCollapsed,
    rightCollapsed,
    toggleLeft,
    toggleRight,
    setLeftCollapsed,
    setRightCollapsed,
  };
}
