"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Size {
  width: number;
  height: number;
}

export function useResizeObserver<T extends Element = Element>() {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  const disconnect = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  };

  const ref = useCallback(
    (node: T | null) => {
      disconnect();
      if (!node || typeof window === "undefined") return;
      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
      observerRef.current.observe(node);
    },
    [],
  );

  useEffect(() => () => disconnect(), []);

  return { ref, size };
}
