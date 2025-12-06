"use client";

import { Card } from "@/components/ui/Card";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card className={`p-3 ${className ?? ""}`}>
      <p className="text-[0.65rem] tracking-[0.2em] text-gray-500 mb-1 uppercase">
        {label}
      </p>
      <p className="text-xl font-semibold mb-1">{value}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
    </Card>
  );
}
