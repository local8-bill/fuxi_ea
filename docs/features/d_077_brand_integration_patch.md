### 🧭 **Directive — FUXI Brand Asset Generator Patch (Hand-Drawn Crown Integration)**  

**Objective:**  
Replace the geometric crown template in the brand asset generator with the correct **hand-drawn crown** geometry, while keeping all existing metallic finish and lighting logic intact.  

---

#### **Instructions for Codex**

1. **Open**  
   `scripts/generate_fuxi_brand_assets.js`

2. **Update Template Path**  
   Locate this line near the top of the file:  
   ```js
   const templatePath = path.join(projectRoot, "ux_assets", "master_crown_template.svg");
   ```  
   Replace it with:  
   ```js
   const templatePath = path.join(projectRoot, "ux_assets", "master_crown_vectorized.svg");
   ```

3. **Prevent Geometry Overwrites**  
   If any logic modifies SVG placeholders like `{{DEFS}}` or `{{CIRCLE_FILL}}`, replace the entire return section with:  
   ```js
   return template.replace("</svg>", `${defsBlock}</svg>`);
   ```  
   This ensures color gradients and metallic defs are appended, not used to overwrite the crown path.

4. **Update Output Naming (Optional)**  
   To distinguish the new authentic set, update file naming to:  
   ```js
   const filePath = path.join(outputDir, `fuxi_crown_${variant}_handdrawn.svg`);
   ```  

5. **Run the Generator**  
   From the project root:  
   ```bash
   node scripts/generate_fuxi_brand_assets.js
   ```  
   or  
   ```bash
   npx node scripts/generate_fuxi_brand_assets.js
   ```

6. **Expected Output Folder:**  
   ```
   /public/assets/brand/icons/
     fuxi_crown_ink_handdrawn.svg
     fuxi_crown_obsidian_handdrawn.svg
     fuxi_crown_saffron_handdrawn.svg
     fuxi_crown_slate_handdrawn.svg
     fuxi_crown_tide_handdrawn.svg
   ```

---

#### **Verification Criteria**
✅ All five crowns render with the **original hand-drawn silhouette**  
✅ Metallic highlights and gradients remain visually identical to previous builds  
✅ SVGs are exported at 512 × 512 and maintain transparent backgrounds  
✅ No geometry smoothing, stroke simplification, or symmetry correction occurs  

---

#### **Post-Execution Command Block**
After completing the build, Codex should automatically:
```bash
# 1. Generate the brand assets
node scripts/generate_fuxi_brand_assets.js

# 2. Open the output folder in Finder (macOS)
open public/assets/brand/icons/

# 3. Log summary
ls -lh public/assets/brand/icons/
echo "✅ FUXI brand crowns successfully generated with hand-drawn geometry."
```

---

**Authority:** Bill Maynard  
**Directive Tag:** D077-Brand-Integration-Patch  
**Status:** Active — immediate execution authorized

