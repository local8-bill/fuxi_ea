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
    <div className="rounded-2xl border border-white/10 bg-[#1f1f2f] p-4 text-sm text-white">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#a1a1aa]">Option Menu</p>
      <div className="mt-3 space-y-2">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
            onClick={() => onAction?.(item.id)}
          >
            <span className="block">{item.label}</span>
            <span className="text-xs font-normal text-[#a1a1aa]">{item.helper}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
