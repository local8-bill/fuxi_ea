import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Runtime-only lint scope:
    "docs/**",
    "playwright-report/**",
    "tests/**",
    "scripts/**",
    "src/dev/**",
    "src/legacy/**",
    "public/**",
    "coverage/**",
    "dist/**",
    "tailwind.config.js",
    // Temporarily ignore heavy back-end/legacy surfaces until D088B
    "src/app/api/**",
    "src/adapters/**",
    "src/agents/**",
    "src/lib/graph/**",
    "src/lib/telemetry/**",
    "src/app/project/[id]/digital-enterprise/cyto/**",
    "src/ui/components/CapabilityAccordionCard.tsx",
    "src/ui/components/ImportPanel.tsx",
    "src/ui/components/VisionPanel.tsx",
  ]),
]);

export default eslintConfig;
