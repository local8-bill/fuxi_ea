import { describe, it, expect } from "vitest";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function collectFiles(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes("node_modules") || full.includes(".next")) continue;
      await collectFiles(full, acc);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      acc.push(full);
    }
  }
  return acc;
}

const banned = /(UnifiedLayout|LegacyTopbar|ChatPane)/;

describe("UXShell legacy import guard", () => {
  it("fails if legacy components are imported", async () => {
    const files = await collectFiles("src");
    for (const file of files) {
      const text = await readFile(file, "utf8");
      expect(text).not.toMatch(banned);
    }
  });
});
