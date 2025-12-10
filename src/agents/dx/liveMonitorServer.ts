'use server';

import fs from "node:fs";
import path from "node:path";

export async function verifyLatestBackupOnServer(): Promise<boolean> {
  try {
    const backupDir = path.resolve(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      console.warn("⚠️ dx: No backup directory found at /backups.");
      return false;
    }

    const files = fs
      .readdirSync(backupDir)
      .filter((file) => file.startsWith("graph_") && file.endsWith(".json"))
      .map((file) => ({
        name: file,
        mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime(),
        size: fs.statSync(path.join(backupDir, file)).size,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) {
      console.warn("⚠️ dx: No backup files found in /backups.");
      return false;
    }

    const latest = files[0];
    if (latest.size < 1000) {
      console.warn(`⚠️ dx: Latest backup (${latest.name}) appears too small (${latest.size} bytes).`);
      return false;
    }

    console.log(`💾 dx: Verified latest backup → ${latest.name} (${(latest.size / 1024).toFixed(1)} KB)`);
    return true;
  } catch (error: any) {
    console.error("❌ dx: Backup verification failed:", error?.message ?? error);
    return false;
  }
}
