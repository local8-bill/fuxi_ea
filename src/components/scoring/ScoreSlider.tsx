"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export function ScoreSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 5,
  step = 0.5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-700">{label}</span>
        <Badge variant="secondary">{value}</Badge>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className="accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{min} • Emerging</span>
        <span>{((min + max) / 2).toFixed(0)} • Established</span>
        <span>{max} • Leading</span>
      </div>
    </label>
  );
}

export default ScoreSlider;