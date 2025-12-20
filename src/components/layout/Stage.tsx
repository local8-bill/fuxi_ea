"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

interface StageProps {
  children: ReactNode;
  padded?: boolean;
  className?: string;
}

export function Stage({ children, padded = true, className }: StageProps) {
  return (
    <section
      className={clsx(
        "relative flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-sm min-h-0",
        padded ? "p-6" : "",
        className,
      )}
    >
      {children}
    </section>
  );
}
