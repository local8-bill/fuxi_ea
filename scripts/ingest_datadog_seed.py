#!/usr/bin/env python3
"""
scripts/ingest_datadog_seed.py

Convert a Datadog service export (CSV) into a normalized integration snapshot
for ALE ingestion (/api/ale/integration-flows), and includes a rollback option
for safely removing seeded data.

Usage:
    python scripts/ingest_datadog_seed.py datadog-service-list.csv
    python scripts/ingest_datadog_seed.py --rollback
"""

import csv, json, sys, os, hashlib, datetime

try:
    import requests  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    requests = None
    import urllib.request
    import urllib.error

API_URL = "http://localhost:3000/api/ale/integration-flows"

def normalize_row(row):
    row_lower = {(k or "").strip().lower(): v for k, v in row.items()}
    name = row_lower.get("service_name") or row_lower.get("name") or "unknown_service"
    owner = row_lower.get("team") or row_lower.get("owner") or "unassigned"
    env = row_lower.get("env") or row_lower.get("environment") or "prod"
    status = row_lower.get("status") or "healthy"
    dependencies = row_lower.get("dependencies") or row_lower.get("depends_on") or ""
    deps = [d.strip() for d in dependencies.split(",") if d.strip()]

    flows = []
    for dep in deps or ["_none_"]:
        flow_id = f"{name}_to_{dep}"
        hashed = hashlib.sha1(flow_id.encode()).hexdigest()[:8]
        flows.append({
            "flow_id": f"{flow_id}_{hashed}",
            "source": "datadog",
            "system_from": name,
            "system_to": dep if dep != "_none_" else "external",
            "env": env,
            "status": status.lower(),
            "last_seen": datetime.datetime.utcnow().isoformat() + "Z",
            "latency_ms": float(row_lower.get("latency_ms") or row_lower.get("latency (ms)") or 0),
            "error_rate": float(row_lower.get("error_rate") or row_lower.get("error rate") or 0),
            "owner_team": owner,
            "confidence": 0.9 if status.lower() == "healthy" else 0.6
        })
    return flows

def detect_delimiter(sample: str):
    try:
        return csv.Sniffer().sniff(sample, delimiters=",\t;").delimiter
    except Exception:
        return ","

def ingest_data(path):
    if not os.path.exists(path):
        sys.exit(f"❌ File not found: {path}")

    out_dir = "data/integration/seed"
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "datadog_integration_snapshot.json")

    all_flows = []
    with open(path, "r", encoding="utf-8") as f:
        sample = f.read(4096)
        delimiter = detect_delimiter(sample)
        f.seek(0)
        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            all_flows.extend(normalize_row(row))

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_flows, f, indent=2)

    print(f"✅ Generated {len(all_flows)} flows → {out_path}")
    print("Next: POST to /api/ale/integration-flows to seed the intelligence layer.")

    # Optional: Push to ALE endpoint
    try:
        if requests:
            response = requests.post(API_URL, json=all_flows, timeout=10)
            if response.status_code == 200:
                print(f"✅ Successfully seeded {len(all_flows)} flows to ALE store.")
            else:
                print(f"⚠️ Seeding failed: {response.status_code} - {response.text}")
        else:
            req = urllib.request.Request(
                API_URL,
                data=json.dumps(all_flows).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                print(f"✅ Seeded via urllib: {body[:120]}…")
    except Exception as e:
        print(f"⚠️ Could not reach ALE endpoint: {e}")

def rollback_seed():
    """Remove all previously seeded Datadog integration flows from ALE store."""
    try:
        target = f"{API_URL}?source=datadog"
        if requests:
            response = requests.delete(target, timeout=10)
            if response.status_code == 200:
                print("♻️ Rollback complete: all Datadog-seeded flows removed.")
            else:
                print(f"⚠️ Rollback failed: {response.status_code} - {response.text}")
        else:
            req = urllib.request.Request(target, method="DELETE")
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = resp.read().decode("utf-8")
                print(f"♻️ Rollback response: {body[:120]}…")
    except Exception as e:
        print(f"⚠️ Could not reach ALE endpoint for rollback: {e}")

def main():
    if len(sys.argv) == 2 and sys.argv[1] == "--rollback":
        rollback_seed()
    elif len(sys.argv) == 2:
        ingest_data(sys.argv[1])
    else:
        sys.exit("Usage: python scripts/ingest_datadog_seed.py <datadog-service-list.csv> | --rollback")

if __name__ == "__main__":
    main()
