"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
