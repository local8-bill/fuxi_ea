"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/Card";

const THEMES = ["zinc", "slate", "stone", "indigo", "sky", "neutral"];

export function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<string>("zinc");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSwitch = (theme: string) => {
    startTransition(async () => {
      setMessage(null);
      try {
        const res = await fetch(`/api/dev/theme?theme=${theme}`);
        const json = await res.json();
        if (!res.ok || !json?.ok) {
          throw new Error(json?.message ?? "Failed to apply theme.");
        }
        setActiveTheme(theme);
        setMessage(`Applied ${theme}. Restart dev server to see full effect.`);
      } catch (err: any) {
        setMessage(err?.message ?? "Theme switch failed.");
      }
    });
  };

  return (
    <Card className="space-y-4 bg-[#181827] text-white">
      <div>
        <h3 className="text-lg font-semibold">Theme Test Harness</h3>
        <p className="text-sm text-slate-300">Preview the ShadCN/Tailwind base palettes for the prototype.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((theme) => (
          <Button key={theme} variant={theme === activeTheme ? "default" : "outline"} disabled={pending} onClick={() => handleSwitch(theme)}>
            {theme}
          </Button>
        ))}
      </div>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
    </Card>
  );
}
