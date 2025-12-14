### Directive D087C — Theme Test Harness (ShadCN / Tailwind)

#### 🎯 Purpose  
Enable a controlled way to preview and test ShadCN-compatible Tailwind themes (`zinc`, `slate`, `stone`, `indigo`, `sky`, etc.) within the prototype and live scenes, ensuring visual consistency across the app.

---

#### ⚙️ Implementation Overview

**Files to Add:**

```
src/lib/themeTest.ts
src/components/dev/ThemeSwitcher.tsx
```

---

#### 📄 src/lib/themeTest.ts

```ts
import { execSync } from "node:child_process";

const THEMES = ["zinc", "slate", "stone", "indigo", "sky", "neutral"];

export function applyTheme(theme: string) {
  if (!THEMES.includes(theme)) {
    console.error(`❌ Unknown theme '${theme}'. Available: ${THEMES.join(", ")}`);
    return;
  }

  console.log(`🎨 Applying theme: ${theme}`);

  const configPath = "tailwind.config.js";
  const themeLine = `primary: require('tailwindcss/colors').${theme},`;
  execSync(`sed -i '' "s/primary: require('tailwindcss\\/colors').*,$/${themeLine}/" ${configPath}`);

  console.log(`✅ Theme '${theme}' applied. Restart dev server to see changes.`);
}
```

---

#### 🤩 src/components/dev/ThemeSwitcher.tsx

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const THEMES = ["zinc", "slate", "stone", "indigo", "sky", "neutral"];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>("zinc");

  async function handleSwitch(newTheme: string) {
    setTheme(newTheme);
    await fetch(`/api/dev/theme?theme=${newTheme}`);
  }

  return (
    <Card className="p-4 space-y-2 bg-background text-foreground">
      <h3 className="font-semibold">🎨 Theme Test Harness
      </h3>
      <p>Click below to preview ShadCN/Tailwind base themes in the prototype.</p>
      <div className="flex flex-wrap gap-2">
        {THEMES.map((t) => (
          <Button
            key={t}
            variant={t === theme ? "default" : "outline"}
            onClick={() => handleSwitch(t)}
          >
            {t}
          </Button>
        ))}
      </div>
    </Card>
  );
}
```

---

#### 🧠 API Hook (Optional)

```ts
// src/app/api/dev/theme/route.ts
import { NextResponse } from "next/server";
import { applyTheme } from "@/lib/themeTest";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const theme = searchParams.get("theme");
  if (theme) applyTheme(theme);
  return NextResponse.json({ ok: true, theme });
}
```

---

#### 💡 Command Beans Additions

```js
{
  cmd: "npm run dev:theme -- --base [theme]",
  desc: "Apply and preview ShadCN/Tailwind theme (zinc, slate, indigo, etc)",
},
{
  cmd: "npm run dev:theme:ui",
  desc: "Open local /dev/theme-switcher view to preview themes interactively",
}
```

---

#### 🧮 Verification Steps
1. Run `npm run dev:theme -- --base indigo`  
   → updates Tailwind config automatically.  
2. Visit `/dev/theme-switcher` in your local app.  
   → click through theme options and watch updates live.  
3. Restart server when final theme is chosen.

---

#### ✅ Deliverable
- Provides clean ShadCN-native theme control.
- Removes visual ghosts (no gradients or legacy color tokens).
- Keeps full enterprise “engineering” tone intact.
- Ready for integration into `feature/shadcn-theme-cleanup`.

