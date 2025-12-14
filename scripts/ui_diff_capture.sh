#!/usr/bin/env bash
# Capture before/after UI screenshots (Graph Prototype) and generate a diff image.

set -euo pipefail

ROUTE="${1:-/dev/graph-prototype}"
BASE_REF="${BASE_REF:-HEAD}"
NAME="${NAME:-graph-prototype}"
ROOT_DIR="$(pwd)"
OUT_DIR="$ROOT_DIR/playwright-report/ui-diff"
TMP_DIR="$ROOT_DIR/.tmp/ui-diff"
BASE_WORKTREE="$TMP_DIR/base"
mkdir -p "$OUT_DIR" "$TMP_DIR"

timestamp="$(date +%Y%m%d-%H%M%S)"
before_file="$OUT_DIR/${timestamp}-${NAME}-before.png"
after_file="$OUT_DIR/${timestamp}-${NAME}-after.png"
diff_file="$OUT_DIR/${timestamp}-${NAME}-diff.png"

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  if git worktree list | grep -q "$BASE_WORKTREE"; then
    git worktree remove --force "$BASE_WORKTREE" >/dev/null 2>&1 || true
  fi
  rm -rf "$BASE_WORKTREE"
}
trap cleanup EXIT

start_server_and_capture() {
  local dir="$1"
  local port="$2"
  local outfile="$3"
  pushd "$dir" >/dev/null
  rm -f .next/dev/lock 2>/dev/null || true
  echo "[start] dev server in $dir on port $port"
  npm run dev -- -p "$port" >"$OUT_DIR/server-${port}.log" 2>&1 &
  SERVER_PID=$!
  popd >/dev/null

  echo "[wait] checking server on port $port"
  for _ in $(seq 1 90); do
    if curl -fs "http://127.0.0.1:${port}${ROUTE}" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -fs "http://127.0.0.1:${port}${ROUTE}" >/dev/null 2>&1; then
    echo "[error] server did not become ready on port $port"
    exit 1
  fi

  echo "[capture] writing screenshot to $outfile"
  npx playwright screenshot --viewport-size=1440,900 "http://127.0.0.1:${port}${ROUTE}" "$outfile" >/dev/null

  kill "$SERVER_PID" >/dev/null 2>&1 || true
  wait "$SERVER_PID" >/dev/null 2>&1 || true
  unset SERVER_PID
}

echo "[setup] preparing baseline worktree ($BASE_REF)"
if git worktree list | grep -q "$BASE_WORKTREE"; then
  git worktree remove --force "$BASE_WORKTREE" >/dev/null 2>&1 || true
fi
rm -rf "$BASE_WORKTREE"
git worktree add "$BASE_WORKTREE" "$BASE_REF" >/dev/null

if [ ! -e "$BASE_WORKTREE/node_modules" ]; then
  ln -s "$ROOT_DIR/node_modules" "$BASE_WORKTREE/node_modules"
fi
if [ -d "$ROOT_DIR/src/data" ]; then
  mkdir -p "$BASE_WORKTREE/src/data"
  rsync -a "$ROOT_DIR/src/data/" "$BASE_WORKTREE/src/data/" >/dev/null
fi

start_server_and_capture "$BASE_WORKTREE" 4020 "$before_file"
git worktree remove --force "$BASE_WORKTREE" >/dev/null 2>&1 || true
rm -rf "$BASE_WORKTREE"

start_server_and_capture "$ROOT_DIR" 4021 "$after_file"

echo "[diff] computing pixel diff"
npx -y -p pixelmatch@5.3.0 -p pngjs@7.0.0 node - <<'NODE' "$before_file" "$after_file" "$diff_file"
const fs = require("fs");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");
const [before, after, diff] = process.argv.slice(2);
const img1 = PNG.sync.read(fs.readFileSync(before));
const img2 = PNG.sync.read(fs.readFileSync(after));
if (img1.width !== img2.width || img1.height !== img2.height) {
  console.error("Screenshot dimensions differ; cannot compute diff.");
  process.exit(1);
}
const diffPng = new PNG({ width: img1.width, height: img1.height });
const mismatched = pixelmatch(img1.data, img2.data, diffPng.data, img1.width, img1.height, { threshold: 0.1, includeAA: true });
fs.writeFileSync(diff, PNG.sync.write(diffPng));
console.log("Diff pixels:", mismatched);
NODE

echo "[done] screenshots saved:"
echo "   Before: $before_file"
echo "   After : $after_file"
echo "   Diff  : $diff_file"
