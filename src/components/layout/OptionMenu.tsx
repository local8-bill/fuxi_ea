"use client";

const MENU_ITEMS = [
  { id: "sequence", label: "Build a Sequence", helper: "Draft modernization steps" },
  { id: "harmonize", label: "Harmonize Stack", helper: "Align systems before simulating" },
  { id: "view", label: "Add View", helper: "Capture a reusable lens" },
] as const;

type OptionId = (typeof MENU_ITEMS)[number]["id"];

interface OptionMenuProps {
  onAction?: (id: OptionId) => void;
}

export function OptionMenu({ onAction }: OptionMenuProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Option Menu</p>
      <div className="mt-3 space-y-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 transition hover:border-slate-900"
            onClick={() => onAction?.(item.id)}
          >
            <span className="block">{item.label}</span>
            <span className="text-xs font-normal text-slate-500">{item.helper}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
