"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

interface StageProps {
  children: ReactNode;
  padded?: boolean;
}

export function Stage({ children, padded = true }: StageProps) {
  return (
    <section
      className={clsx(
        "relative flex min-h-[600px] flex-1 flex-col rounded-3xl border border-white/10 bg-[#181827] text-white",
        padded ? "p-6" : "",
      )}
    >
      {children}
    </section>
  );
}
