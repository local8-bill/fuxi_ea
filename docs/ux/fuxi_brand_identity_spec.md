## 👑 Directive FUXI-BRAND-01 – Fuxi_EA Brand Identity Specification (v1)

**Version:** v1.0  
**Purpose:** Define the official visual identity system for Fuxi_EA — including logo variants, color specifications, usage guidelines, and animation behaviors — to ensure consistent, elegant, and intelligent representation across product, documentation, and marketing surfaces.

---

### 1️⃣ Brand Philosophy
Fuxi_EA’s visual identity blends *human creativity* and *digital precision*. The crown, inspired by Jean-Michel Basquiat’s iconic symbol, represents authorship, mastery, and creative sovereignty — reinterpreted here through the lens of architectural intelligence.

Each variant of the Fuxi crown reflects a different **state of intelligence** — from human intuition to structured digital reasoning.

| Symbol | Meaning |
|---------|----------|
| **Crown** | Authority of creative intelligence and mastery over complexity. |
| **Circle** | Unity, completion, and the infinite mesh of connected systems. |
| **Color & Material** | Represent transformation from artistry to computation. |

---

### 2️⃣ Official Logo Set – Crown Variants
**Primary Symbol:** The Crown within the Circle  
**Aspect Ratio:** 1:1  
**Geometry:** Consistent circle diameter and crown height across all variants.  

| # | Name | Description | Use Case |
|---|------|--------------|-----------|
| 1️⃣ | **Basquiat Black** | Hand-drawn black crown on white circle. | Primary for documentation, print, and monochrome contexts. |
| 2️⃣ | **Basquiat Gold** | Expressive gold crown on black circle. | Creativity, exploration, discovery modules. |
| 3️⃣ | **Teal Mesh** | Teal gradient crown (#00B9C9→#006F84) on deep navy circle. | Analytical and Harmonization contexts. |
| 4️⃣ | **White Contrast** | White crown on solid navy circle; transparent background. | Dark mode and overlay applications. |
| 5️⃣ | **Digital Silver** | Metallic silver crown (#D4D6DA→#F5F6F8) on graphite circle. | Premium surfaces and system-level branding. |
| 6️⃣ | **Glass Gradient** | Translucent crown with soft reflections; matte gray circle. | Onboarding, guided tours, and presentation visuals. |
| 7️⃣ | **Mesh Blue (Primary)** | Silver-white geometric crown on deep-space blue circle (#0A1F3F→#0E2A56). | Core identity mark for product and launch screens. |

---

### 3️⃣ Color Tokens
| Token | Hex / Gradient | Description |
|--------|----------------|-------------|
| `--fuxi-gold` | `#FFD75A` | Expressive, creative energy. |
| `--fuxi-black` | `#111111` | Authority and grounding. |
| `--fuxi-teal-gradient` | `linear(#00B9C9, #006F84)` | Intelligence and connection. |
| `--fuxi-blue-gradient` | `radial(#0A1F3F, #0E2A56)` | Deep reasoning and clarity. |
| `--fuxi-silver` | `#E6E8EB` | Precision and refinement. |
| `--fuxi-glass` | `rgba(255,255,255,0.25)` | Transparency and insight. |

---

### 4️⃣ Usage Guidelines
- **Minimum Size:** 24px (digital) / 10mm (print).  
- **Padding:** 15% of total icon diameter.  
- **No Distortion:** Never stretch, skew, or rotate the crown.  
- **No Color Overrides:** Use defined color tokens only.  
- **Background Control:** Maintain appropriate contrast.  
  - Light backgrounds → use Black or Gold crowns.  
  - Dark backgrounds → use White, Silver, or Mesh Blue crowns.  
- **Transparency:** Only `White Contrast` and `Glass Gradient` allow background visibility.

---

### 5️⃣ Integration & Implementation
**File Path:** `/public/assets/brand/fuxi_crowns_v1/`

| File | Format | Usage |
|-------|---------|--------|
| `fuxi_black.svg` / `.png` | SVG + 1024 PNG | Docs, print. |
| `fuxi_gold.svg` / `.png` | SVG + 1024 PNG | Creative modules. |
| `fuxi_teal.svg` / `.png` | SVG + 1024 PNG | Harmonization flows. |
| `fuxi_white.svg` / `.png` | SVG + 1024 PNG | Dark UI mode. |
| `fuxi_silver.svg` / `.png` | SVG + 1024 PNG | System branding. |
| `fuxi_glass.svg` / `.png` | SVG + 1024 PNG | Onboarding visuals. |
| `fuxi_primary.svg` / `.png` | SVG + 1024 / 2048 PNG | Main app identity, favicon, splash. |

**Manifest Reference:**  
`/public/manifest.json`
```json
{
  "icons": [
    { "src": "/public/assets/brand/fuxi_primary.png", "sizes": "1024x1024", "type": "image/png" }
  ]
}
```

---

### 6️⃣ Motion & Behavioral States

| Mode | Animation | Logo Variant |
|------|------------|---------------|
| **Thinking / Processing** | Subtle pulse glow | Mesh Blue |
| **Discovery / Creative** | Gentle shimmer | Gold |
| **Analytical / Calculation** | Gradient sweep | Teal |
| **Idle / Neutral** | Static matte | Silver |
| **Dark Mode** | Fade-in white outline | White Contrast |
| **Onboarding / Intro** | Crossfade between crowns | Glass Gradient → Mesh Blue |

Animations must remain subtle — *motion as expression, not distraction.*  
Suggested implementation: Lottie or Framer Motion with 300–700ms ease timing.

---

### 7️⃣ Typography & Pairing
| Element | Typeface | Notes |
|----------|-----------|-------|
| **Logotype** | SF Pro Display / Inter | Use with Mesh Blue mark. |
| **Subhead / Body** | Inter / Geist Sans | Match product interface typography. |
| **Spacing** | 0.25em letter-spacing max for wordmarks. |

---

### ✅ Expected Outcome
- Unified Fuxi_EA brand identity with seven distinct but coherent visual states.  
- Icons ready for integration across UXShell, onboarding, harmonization, and ROI modules.  
- Consistent tone and material representation aligning with Fuxi’s philosophy: *human creativity meets architectural intelligence.*

---

**Owner:** Product Design / Brand Systems / Codex Dev  
**Status:** ✅ Active  
**Release Tag:** `v1.0-brand-system`


---

### 🧩 Appendix A – Codex Export & QA Specifications

#### 1️⃣ Export Parameters
| Property | Value | Notes |
|-----------|--------|-------|
| **Artboard Size** | 1024 × 1024 px | Consistent across all variants. |
| **Resolution** | 300 DPI | For scalable print and digital use. |
| **Format** | SVG (primary), PNG @2x (secondary) | Ensure lossless export and vector precision. |
| **Background** | Transparent | Circle remains solid fill; no external shadow. |
| **Alignment** | Centered (X/Y at 50%) | Pixel-perfect geometry alignment across variants. |
| **Stroke Width** | Normalized to 1.25% of canvas width | Prevents inconsistencies in scaling. |
| **Naming Convention** | `fuxi_<variant>.(svg/png)` | Match directive identifiers. |

#### 2️⃣ Automation & QA Checks
Codex must validate each export through automated routines to guarantee pixel and geometry consistency.

```bash
# QA script: validate_crown_icons.js
check('circle_size') // ensures all have same diameter
check('crown_alignment') // verifies crown center offset ≤ 1px
check('color_tokens') // matches approved brand hex codes
check('file_size_limit', '< 1MB') // optimized asset weight
check('svg_viewBox') // uniform scaling viewbox
```

**Pass Criteria:** 100% match with D071-B tone and color tokens; no render deviation > 1px.  
**Fail Action:** Regenerate from master design file or correct color/style mismatch.

#### 3️⃣ Packaging & Delivery
| Step | Description |
|------|--------------|
| 1️⃣ | Verify exports pass QA validation. |
| 2️⃣ | Bundle all variants into `fuxi_crowns_v1.zip`. |
| 3️⃣ | Commit to `/public/assets/brand/`. |
| 4️⃣ | Generate automated preview (brand_readme.md) with thumbnails and file metadata. |
| 5️⃣ | Tag build with `v1.0-brand-assets`. |

#### 4️⃣ Continuous Validation Hook
A post-build script ensures that each time assets are modified, QA revalidates geometry and token accuracy:
```bash
npm run validate:brand
```
If validation fails, build pipeline halts with summary report.

---

**Appendix Owner:** Codex Dev / QA Automation  
**Status:** 🚀 Implement for all brand asset builds  
**Tag:** `v1.0-brand-system-export-spec`
