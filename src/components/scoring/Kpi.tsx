"use client";
export function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
