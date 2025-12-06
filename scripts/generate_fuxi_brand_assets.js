// generate_fuxi_brand_assets.js
// Auto-creates all Fuxi crown logo variants from the master template

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { optimize } from 'svgo';

// Brand token definitions
const brandTokens = {
  black: { circle: '#FFFFFF', crown: '#111111' },
  gold: { circle: '#000000', crown: '#FFD75A' },
  teal: { circle: '#071A26', crown: 'url(#tealGradient)' },
  white: { circle: '#071A26', crown: '#FFFFFF' },
  silver: { circle: '#1B1C1E', crown: '#E6E8EB' },
  glass: { circle: '#E4E7EA', crown: 'rgba(255,255,255,0.25)' },
  primary: { circle: 'url(#blueGradient)', crown: '#F9FAFB' }
};

const templatePath = path.resolve('./design/master_crown_template.svg');
const outputDir = path.resolve('./public/assets/brand');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const masterSVG = fs.readFileSync(templatePath, 'utf-8');

(async () => {
  for (const [variant, { circle, crown }] of Object.entries(brandTokens)) {
    console.log(`\n🎨 Generating ${variant} variant...`);

    // Inject colors into SVG template
    let renderedSVG = masterSVG
      .replace(/\{\{CIRCLE_COLOR\}\}/g, circle)
      .replace(/\{\{CROWN_COLOR\}\}/g, crown);

    // Optimize SVG
    const optimized = optimize(renderedSVG, { multipass: true });
    const svgPath = path.join(outputDir, `fuxi_${variant}.svg`);
    fs.writeFileSync(svgPath, optimized.data);

    // Generate PNG (1024x1024)
    const pngPath = path.join(outputDir, `fuxi_${variant}.png`);
    await sharp(Buffer.from(optimized.data))
      .resize(1024, 1024)
      .png({ quality: 100 })
      .toFile(pngPath);

    console.log(`✅ Created ${variant} SVG and PNG in /public/assets/brand`);
  }

  console.log('\n🚀 All Fuxi crown variants generated successfully!');
})();
