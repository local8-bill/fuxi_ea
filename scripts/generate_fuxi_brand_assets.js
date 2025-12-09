#!/usr/bin/env node
// scripts/generate_fuxi_brand_assets.js
// Generates Fuxi crown variants (SVG + PNG) and a manifest for UI imports.

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { optimize } = require("svgo");

const projectRoot = path.join(__dirname, "..");
const templatePath = path.join(projectRoot, "ux_assets", "master_crown_vectorized.svg");
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
  const fillId = "circle-fill";
  const strokeId = "circle-stroke";
  const crownId = "crown-stroke";
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
        { offset: "0%", color: "#1B1F27" },
        { offset: "60%", color: "#11141A" },
        { offset: "100%", color: "#07090D" },
      ],
      strokeStops: [
        { offset: "0%", color: "#E6EBF3" },
        { offset: "35%", color: "#9EA9BE" },
        { offset: "100%", color: "#5B6578" },
      ],
      crownStops: [
        { offset: "0%", color: "#FCFDFF" },
        { offset: "50%", color: "#D7DEE9" },
        { offset: "100%", color: "#8C95A6" },
      ],
      circleStrokeWidth: 42,
      crownStrokeWidth: 62,
    }),
  midnight: () =>
    metallicVariant("midnight", {
      fillStops: [
        { offset: "0%", color: "#072040" },
        { offset: "55%", color: "#041126" },
        { offset: "100%", color: "#020A14" },
      ],
      strokeStops: [
        { offset: "0%", color: "#7CA8F7" },
        { offset: "60%", color: "#4163A8" },
        { offset: "100%", color: "#1C2F63" },
      ],
      crownStops: [
        { offset: "0%", color: "#C2DAFF" },
        { offset: "60%", color: "#7EA1DF" },
        { offset: "100%", color: "#5571A7" },
      ],
      circleStrokeWidth: 44,
      crownStrokeWidth: 64,
    }),
  slate: () =>
    metallicVariant("slate", {
      fillStops: [
        { offset: "0%", color: "#11151B" },
        { offset: "60%", color: "#0D1015" },
        { offset: "100%", color: "#080A0D" },
      ],
      strokeStops: [
        { offset: "0%", color: "#838D9E" },
        { offset: "50%", color: "#3F4651" },
        { offset: "100%", color: "#23262C" },
      ],
      crownStops: [
        { offset: "0%", color: "#B8C1D0" },
        { offset: "100%", color: "#59606C" },
      ],
      circleStrokeWidth: 40,
      crownStrokeWidth: 60,
    }),
  obsidian: () =>
    metallicVariant("obsidian", {
      fillStops: [
        { offset: "0%", color: "#050506" },
        { offset: "60%", color: "#070708" },
        { offset: "100%", color: "#0B0B0D" },
      ],
      strokeStops: [
        { offset: "0%", color: "#2B2B31" },
        { offset: "100%", color: "#111114" },
      ],
      crownStops: [
        { offset: "0%", color: "#2E3038" },
        { offset: "100%", color: "#1A1B1F" },
      ],
      circleStrokeWidth: 36,
      crownStrokeWidth: 58,
    }),
};

function renderTemplate(config) {
  const defsBlock = config.defs ? `<defs>${config.defs}</defs>` : "";
  const hasLegacyPlaceholders = template.includes("{{DEFS}}");
  if (hasLegacyPlaceholders) {
    return template
      .replace(/{{DEFS}}/g, defsBlock)
      .replace(/{{CIRCLE_FILL}}/g, config.circleFill ?? "#FFFFFF")
      .replace(/{{CIRCLE_STROKE}}/g, config.circleStroke ?? BASE_STROKE)
      .replace(/{{CIRCLE_STROKE_WIDTH}}/g, String(config.circleStrokeWidth ?? DEFAULT_CIRCLE_STROKE_WIDTH))
      .replace(/{{CROWN_FILL}}/g, config.crownFill ?? "none")
      .replace(/{{CROWN_STROKE}}/g, config.crownStroke ?? BASE_STROKE)
      .replace(/{{CROWN_STROKE_WIDTH}}/g, String(config.crownStrokeWidth ?? DEFAULT_CROWN_STROKE_WIDTH));
  }
  if (!defsBlock) return template;
  return template.replace("</svg>", `${defsBlock}</svg>`);
}

async function generateVariant(name, configurator) {
  const config = configurator();
  const rendered = renderTemplate(config);

  const optimized = optimize(rendered, {
    multipass: true,
    floatPrecision: 3,
  }).data;

  const baseFile = `fuxi_crown_${name}_handdrawn`;
  const svgFile = `${baseFile}.svg`;
  const pngFile = `${baseFile}.png`;
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
