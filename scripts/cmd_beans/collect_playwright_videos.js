#!/usr/bin/env node
// Collect Playwright videos into playwright-report/videos with human-friendly names.
// It scans any test-results/*/video.webm and copies them to playwright-report/videos/<folder>.webm.
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const SOURCE_ROOT = path.join(process.cwd(), "test-results");
const DEST_ROOT = path.join(process.cwd(), "playwright-report", "videos");

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true }).catch(() => {});
}

async function walk(dir, files = []) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function collect() {
  await ensureDir(DEST_ROOT);
  let files;
  try {
    files = await walk(SOURCE_ROOT);
  } catch (err) {
    console.error(`[collect-videos] Unable to read ${SOURCE_ROOT}:`, err.message);
    process.exit(1);
  }

  const videoFiles = files.filter((f) => path.basename(f) === "video.webm");
  if (!videoFiles.length) {
    console.log("[collect-videos] No videos found in test-results/");
    return;
  }

  let copied = 0;
  for (const file of videoFiles) {
    const parent = path.basename(path.dirname(file));
    let destName = `${parent}.webm`;
    let destPath = path.join(DEST_ROOT, destName);
    let counter = 1;
    while (fs.existsSync(destPath)) {
      destName = `${parent}-${counter}.webm`;
      destPath = path.join(DEST_ROOT, destName);
      counter += 1;
    }
    try {
      await fsp.copyFile(file, destPath);
      copied += 1;
    } catch (err) {
      console.warn(`[collect-videos] Failed to copy ${file} -> ${destPath}:`, err.message);
    }
  }
  console.log(`[collect-videos] Copied ${copied} video(s) to ${DEST_ROOT}`);
}

collect();
