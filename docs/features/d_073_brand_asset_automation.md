## ⚙️ Directive D073 – Fuxi Brand Asset Automation & Command Bean Registration

**Version:** v0.7.5-draft  
**Purpose:** Define and register the Fuxi_EA Brand Asset Generation process as an executable automation within the Codex Command Beans system, establishing a reusable framework for future asset, build, and validation commands.

---

### 1️⃣ Objective
Automate the creation and validation of all Fuxi_EA brand logo variants using the master SVG template and color token system. Register the generation process as a command-line utility (`beans run brand:generate`) for consistent execution across environments.

---

### 2️⃣ Script Overview
| Script | Path | Function |
|---------|------|-----------|
| **generate_fuxi_brand_assets.js** | `/scripts/` | Generates all crown variants (SVG + PNG) based on `master_crown_template.svg`. |
| **master_crown_template.svg** | `/ux_assets/` | Template geometry with color token placeholders (`{{CIRCLE_COLOR}}`, `{{CROWN_COLOR}}`). |
| **validate_brand_assets.js** *(optional)* | `/scripts/` | QA validation of color, geometry, and export integrity. |

**Dependencies:**  
`sharp`, `svgo`, `fs`, `path`

---

### 3️⃣ Command Bean Registration

**Command Name:** `brand:generate`  
**Alias:** `beans run brand:generate`

**Command Bean Definition:**
```json
{
  "cmd": "brand:generate",
  "script": "/scripts/generate_fuxi_brand_assets.js",
  "description": "Generates all Fuxi crown logo variants using master_crown_template.svg and brand_tokens.js.",
  "category": "Brand Automation",
  "telemetry": true,
  "logs": "/data/logs/brand_generation.log",
  "dependencies": ["sharp", "svgo"],
  "output": "/public/assets/brand/"
}
```

---

### 4️⃣ Execution Flow
1. **Codex Command Beans** triggers the script via:  
   ```bash
   beans run brand:generate
   ```
2. Script loads `/ux_assets/master_crown_template.svg`.
3. Color tokens applied per variant (`brand_tokens.js`).
4. SVG and PNG outputs written to `/public/assets/brand/`.
5. SVGO optimization and Sharp rendering executed per file.
6. Telemetry event `brand_generation_completed` emitted with summary metrics.

---

### 5️⃣ Telemetry & Logging
| Event | Data Fields | Description |
|--------|--------------|--------------|
| `brand_generation_started` | `{ user, timestamp, variants }` | Logged at script start. |
| `brand_variant_created` | `{ variant, svgPath, pngPath, duration }` | Logged per successful export. |
| `brand_generation_completed` | `{ totalVariants, duration, outputDir }` | Emitted at process end. |
| `brand_generation_error` | `{ error, variant, stack }` | Captures runtime exceptions. |

Logs persisted to `/data/logs/brand_generation.log` and accessible via `beans logs brand:generate`.

---

### 6️⃣ QA Integration (Optional Extension)
To validate generated assets, Codex may run:
```bash
beans run brand:validate
```
Which triggers `/scripts/validate_brand_assets.js` to confirm:
- Geometry consistency across variants.  
- Proper brand color usage.  
- Optimized file size (< 1MB).  
- ViewBox and alignment compliance.

---

### 7️⃣ Expansion Path
Future commands can extend this pattern:
| Command | Function |
|----------|-----------|
| `uxshell:build` | Validates UXShell layout and component assets. |
| `tests:run` | Executes Playwright UAT layer with trace collection. |
| `onboarding:reset` | Resets guided onboarding telemetry data. |
| `telemetry:flush` | Purges and rotates telemetry logs. |

Each new command added to the **Command Beans registry** should follow D073’s format.

---

### ✅ Expected Outcome
- Brand asset generation fully automated and reproducible.  
- Codex Command Beans system aware of and capable of executing branding automation.  
- Logs and telemetry integrated for traceability and performance review.  
- Framework established for additional build and validation automations.

---

**Owner:** Codex Dev / Build Automation / QA  
**Status:** 🚀 Active  
**Release Tag:** `v0.7.5-command-beans-automation`

