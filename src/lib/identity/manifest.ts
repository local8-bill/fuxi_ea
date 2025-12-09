import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";

export type ManifestApproval = {
  status: "approved" | "declined" | "pending";
  timestamp?: string;
  signature?: string;
};

export type PairingRecord = {
  pairing_id: string;
  human_manifest: string;
  agent_manifest: string;
  approvals: {
    fuxi?: ManifestApproval;
    agent_z?: ManifestApproval;
  };
  pairing_status: "pending" | "active" | "declined";
};

export type ManifestSummary = {
  id: string;
  name: string;
  role?: string;
  mission?: string;
  tone?: string;
  interaction_style?: string;
  focus_domains?: string[];
  description?: string;
  permissions?: string[];
};

const ROOT = process.cwd();
const AGENT_DIR = path.join(ROOT, "agents");
const IDENTITY_DIR = path.join(ROOT, ".fuxi", "data", "identity");
const PAIRINGS_FILE = path.join(IDENTITY_DIR, "pairings.json");

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code !== "ENOENT") {
      console.warn("[identity] failed to read %s", filePath, error);
    }
    return null;
  }
}

async function writeJson<T>(filePath: string, payload: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function loadManifestFile(name: string): Promise<ManifestSummary | null> {
  const filePath = path.join(AGENT_DIR, name);
  return readJson<ManifestSummary>(filePath);
}

export async function loadPairings(): Promise<PairingRecord[]> {
  const records = await readJson<PairingRecord[]>(PAIRINGS_FILE);
  return records ?? [];
}

export async function savePairings(records: PairingRecord[]) {
  await writeJson(PAIRINGS_FILE, records);
}

export async function createOrUpdatePairing(params: {
  human_manifest: string;
  agent_manifest: string;
  approver: "fuxi" | "agent_z";
  decision: "approved" | "declined";
  signature?: string;
}) {
  const records = await loadPairings();
  let record = records.find(
    (r) =>
      r.human_manifest === params.human_manifest &&
      r.agent_manifest === params.agent_manifest &&
      r.pairing_status !== "declined",
  );

  if (!record) {
    record = {
      pairing_id: randomUUID(),
      human_manifest: params.human_manifest,
      agent_manifest: params.agent_manifest,
      approvals: {},
      pairing_status: "pending",
    };
    records.push(record);
  }

  record.approvals[params.approver] = {
    status: params.decision,
    timestamp: new Date().toISOString(),
    signature: params.signature,
  };

  const fuxiStatus = record.approvals.fuxi?.status;
  const agentZStatus = record.approvals.agent_z?.status;
  if (fuxiStatus === "approved" && agentZStatus === "approved") {
    record.pairing_status = "active";
  } else if (fuxiStatus === "declined" || agentZStatus === "declined") {
    record.pairing_status = "declined";
  } else {
    record.pairing_status = "pending";
  }

  await savePairings(records);
  return record;
}

export async function getActivePairing() {
  const records = await loadPairings();
  return records.find((r) => r.pairing_status === "active") ?? null;
}
