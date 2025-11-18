"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface WorkspaceHeaderProps {
  statusLabel: string;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
}

export function WorkspaceHeader({
  statusLabel,
  title,
  description,
  className,
  children,
}: WorkspaceHeaderProps) {
  return (
    <section className={clsx("mb-8", className)}>
      <p className="text-[0.65rem] tracking-[0.25em] text-gray-500 mb-2 uppercase">
        {statusLabel}
      </p>
      <h1 className="text-3xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-gray-500 max-w-2xl">{description}</p>
      {children}
    </section>
  );
}
