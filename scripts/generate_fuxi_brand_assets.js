#!/usr/bin/env node
// scripts/generate_fuxi_brand_assets.js
// Generates Fuxi crown variants (SVG + PNG) and a manifest for UI imports.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { optimize } = require("svgo");

const projectRoot = path.join(__dirname, "..");
const templatePath = path.join(projectRoot, "ux_assets", "master_crown_template.svg");
const outputDir = path.join(projectRoot, "public", "assets", "brand", "icons");
const manifestPath = path.join(outputDir, "manifest.json");

const BASE_STROKE = "#0B0B0B";
const DEFAULT_CIRCLE_STROKE_WIDTH = 40;
const DEFAULT_CROWN_STROKE_WIDTH = 65;

const args = new Set(process.argv.slice(2));
const svgOnly = args.has("--svg-only");
const pngOnly = args.has("--png-only");

if (svgOnly && pngOnly) {
  console.error("❌ Cannot use --svg-only and --png-only simultaneously.");
  process.exit(1);
}

const shouldWriteSvg = !pngOnly;
const shouldWritePng = !svgOnly;

if (!shouldWriteSvg && !shouldWritePng) {
  console.log("⚠️ Nothing to generate (both SVG and PNG outputs are disabled).");
  process.exit(0);
}

if (!fs.existsSync(templatePath)) {
  console.error(`❌ Template not found at ${templatePath}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });
const template = fs.readFileSync(templatePath, "utf8");

const stopsToSvg = (stops) =>
  stops
    .map(
      (stop) =>
        `<stop offset="${stop.offset}" stop-color="${stop.color}"${
          stop.opacity !== undefined ? ` stop-opacity="${stop.opacity}"` : ""
        } />`,
    )
    .join("");

const linearGradient = (id, stops, attrs = `x1="0%" y1="0%" x2="100%" y2="100%"`) =>
  `<linearGradient id="${id}" ${attrs}>${stopsToSvg(stops)}</linearGradient>`;

const radialGradient = (id, stops, attrs = `cx="50%" cy="45%" r="65%" fx="40%" fy="30%"`) =>
  `<radialGradient id="${id}" ${attrs}>${stopsToSvg(stops)}</radialGradient>`;

const metallicVariant = (variant, config) => {
  const fillId = `${variant}-fill`;
  const strokeId = `${variant}-stroke`;
  const crownId = `${variant}-crown`;
  const defs = [
    config.fillStops ? radialGradient(fillId, config.fillStops, config.fillGradientAttrs) : "",
    config.strokeStops ? linearGradient(strokeId, config.strokeStops, config.strokeGradientAttrs) : "",
    config.crownStops
      ? linearGradient(crownId, config.crownStops, config.crownGradientAttrs)
      : config.strokeStops
        ? linearGradient(crownId, config.strokeStops, config.crownGradientAttrs ?? config.strokeGradientAttrs)
        : "",
  ]
    .filter(Boolean)
    .join("");

  return {
    defs,
    circleFill: config.fillStops ? `url(#${fillId})` : config.circleFill ?? "#FFFFFF",
    circleStroke: config.strokeStops ? `url(#${strokeId})` : config.circleStroke ?? BASE_STROKE,
    circleStrokeWidth: config.circleStrokeWidth ?? DEFAULT_CIRCLE_STROKE_WIDTH,
    crownFill: "none",
    crownStroke: config.crownStops || config.strokeStops ? `url(#${crownId})` : config.crownStroke ?? BASE_STROKE,
    crownStrokeWidth: config.crownStrokeWidth ?? DEFAULT_CROWN_STROKE_WIDTH,
  };
};

const brandTokens = {
  argent: () =>
    metallicVariant("argent", {
      fillStops: [
        { offset: "0%", color: "#F5F7FA" },
        { offset: "65%", color: "#CED4DC" },
        { offset: "100%", color: "#A7AFBD" },
      ],
      strokeStops: [
        { offset: "0%", color: "#FFFFFF" },
        { offset: "100%", color: "#7A8698" },
      ],
      crownStops: [
        { offset: "0%", color: "#DCE2EA" },
        { offset: "100%", color: "#9AA3B4" },
      ],
    }),
  midnight: () =>
    metallicVariant("midnight", {
      fillStops: [
        { offset: "0%", color: "#0D1F3B" },
        { offset: "70%", color: "#0A1630" },
        { offset: "100%", color: "#071026" },
      ],
      strokeStops: [
        { offset: "0%", color: "#5E7CCF" },
        { offset: "100%", color: "#AABBE8" },
      ],
      crownStops: [
        { offset: "0%", color: "#BBD6FF" },
        { offset: "100%", color: "#7EA0E3" },
      ],
    }),
  slate: () =>
    metallicVariant("slate", {
      fillStops: [
        { offset: "0%", color: "#1E222A" },
        { offset: "65%", color: "#282D37" },
        { offset: "100%", color: "#303641" },
      ],
      strokeStops: [
        { offset: "0%", color: "#8F9AA9" },
        { offset: "100%", color: "#4D5664" },
      ],
      crownStops: [
        { offset: "0%", color: "#D4DAE4" },
        { offset: "100%", color: "#8B96A3" },
      ],
    }),
  obsidian: () =>
    metallicVariant("obsidian", {
      fillStops: [
        { offset: "0%", color: "#0E0F12" },
        { offset: "70%", color: "#15171B" },
        { offset: "100%", color: "#1B1E23" },
      ],
      strokeStops: [
        { offset: "0%", color: "#34363C" },
        { offset: "100%", color: "#1E2024" },
      ],
      crownStops: [
        { offset: "0%", color: "#3F4249" },
        { offset: "100%", color: "#15161A" },
      ],
      circleStrokeWidth: 32,
      crownStrokeWidth: 58,
    }),
};

function renderTemplate(config) {
  const defsBlock = config.defs ? `<defs>${config.defs}</defs>` : "";
  return template
    .replace(/{{DEFS}}/g, defsBlock)
    .replace(/{{CIRCLE_FILL}}/g, config.circleFill ?? "#FFFFFF")
    .replace(/{{CIRCLE_STROKE}}/g, config.circleStroke ?? BASE_STROKE)
    .replace(/{{CIRCLE_STROKE_WIDTH}}/g, String(config.circleStrokeWidth ?? DEFAULT_CIRCLE_STROKE_WIDTH))
    .replace(/{{CROWN_FILL}}/g, config.crownFill ?? "none")
    .replace(/{{CROWN_STROKE}}/g, config.crownStroke ?? BASE_STROKE)
    .replace(/{{CROWN_STROKE_WIDTH}}/g, String(config.crownStrokeWidth ?? DEFAULT_CROWN_STROKE_WIDTH));
}

async function generateVariant(name, configurator) {
  const config = configurator();
  const rendered = renderTemplate(config);

  const optimized = optimize(rendered, {
    multipass: true,
    floatPrecision: 3,
  }).data;

  const svgFile = `fuxi_crown_${name}.svg`;
  const pngFile = `fuxi_crown_${name}.png`;
  const svgPath = path.join(outputDir, svgFile);
  const pngPath = path.join(outputDir, pngFile);

  if (shouldWriteSvg) {
    fs.writeFileSync(svgPath, optimized);
    console.log(`✅ SVG created: ${svgPath}`);
  }

  if (shouldWritePng) {
    await sharp(Buffer.from(optimized))
      .resize(1024, 1024)
      .png({ quality: 100 })
      .toFile(pngPath);
    console.log(`✅ PNG created: ${pngPath}`);
  }

  if (shouldWriteSvg) return `/assets/brand/icons/${svgFile}`;
  if (shouldWritePng) return `/assets/brand/icons/${pngFile}`;
  return "";
}

async function run() {
  const manifest = {};

  for (const [variant, configurator] of Object.entries(brandTokens)) {
    try {
      console.log(`\n🎨 Generating ${variant} crown...`);
      manifest[variant] = await generateVariant(variant, configurator);
    } catch (err) {
      console.error(`❌ Failed to generate ${variant}:`, err.message);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n🧾 Manifest updated: ${manifestPath}`);
  console.log("\n🚀 Brand asset generation complete!");
}

run().catch((err) => {
  console.error("❌ Unexpected error:", err);
  process.exit(1);
});
