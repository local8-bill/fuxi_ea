## 🧩 Command Beans Directive: `generate_fuxi_brand_assets`

### **Purpose**
Generate brand-consistent Fuxi crown icons (SVG + PNG) and a manifest file for import into the UI.  
This replaces the previous `generate_fuxi_icons.js` script and should be used as the canonical brand-asset generator for all environments.

---

### **Setup Requirements**
- Node.js ≥ 18  
- Packages: `sharp`, `svgo` (already in repo)  
- Path: `scripts/generate_fuxi_brand_assets.js`  
- Output: `/public/assets/brand/icons/`  

---

### **Shebang + Permissions**
Make sure the file starts with:
```bash
#!/usr/bin/env node
```

Then set permissions:
```bash
chmod +x scripts/generate_fuxi_brand_assets.js
```

---

### **Execution**
#### 🧠 Local
```bash
# Run full generation (SVG + PNG)
node scripts/generate_fuxi_brand_assets.js

# or, if the shebang is present
./scripts/generate_fuxi_brand_assets.js
```

#### 🧩 Command Beans Task
```json
{
  "id": "generate_fuxi_brand_assets",
  "cmd": "node scripts/generate_fuxi_brand_assets.js",
  "description": "Generate brand-consistent crown icons and manifest for UI imports.",
  "env": ["NODE_ENV=production"],
  "outputs": ["/public/assets/brand/icons/manifest.json"]
}
```

---

### **Optional Flags**
| Flag | Description |
|------|--------------|
| `--svg-only` | Exports SVG assets only (no PNG). |
| `--png-only` | Exports PNG assets only (no SVG). |

**Example:**
```bash
node scripts/generate_fuxi_brand_assets.js --svg-only
```

---

### **Expected Output**
```
/public/assets/brand/icons/
  fuxi_crown_gold.svg
  fuxi_crown_gold.png
  fuxi_crown_navy.svg
  fuxi_crown_teal.svg
  fuxi_crown_black.svg
  manifest.json
```

**manifest.json**
```json
{
  "gold": "/assets/brand/icons/fuxi_crown_gold.svg",
  "navy": "/assets/brand/icons/fuxi_crown_navy.svg",
  "teal": "/assets/brand/icons/fuxi_crown_teal.svg",
  "black": "/assets/brand/icons/fuxi_crown_black.svg"
}
```

---

### **Verification Checklist**
1. ✅ Script runs without errors via `node` or Command Beans.  
2. ✅ All 4+ variants generated correctly (gold, navy, teal, black).  
3. ✅ Transparent PNGs, no white backgrounds.  
4. ✅ `manifest.json` written successfully.  
5. ✅ Output paths match `/public/assets/brand/icons/`.  

---

**Directive Owner:** `Codex / BrandOps`  
**Linked Script:** `scripts/generate_fuxi_brand_assets.js`  
**Last Updated:** v0.4 – Brand Asset Standardization

