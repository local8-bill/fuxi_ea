/**
 * Fuxi_EA Mock Data Seeder
 * Run once to generate sample ingestion data for harmonization (D026/D027)
 *
 * Usage:
 *   node scripts/seed_mock_data.js
 */

import fs from "fs";
import path from "path";

const INGESTED_PATH = path.resolve(".fuxi/data/ingested");
fs.mkdirSync(INGESTED_PATH, { recursive: true });

const systems = [
  "Order Management",
  "Inventory Service",
  "Payment Gateway",
  "Customer CRM",
  "Data Warehouse",
  "Shipping Tracker",
  "Returns Portal",
  "Product Catalog",
  "Analytics Engine",
  "Identity Provider",
];

const vendors = ["SAP", "Oracle", "Salesforce", "AWS", "Azure", "Google Cloud", "Custom"];
const domains = ["Commerce", "Logistics", "Finance", "Customer", "Data", "Core Platform"];

const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) =>
  arr.sort(() => 0.5 - Math.random()).slice(0, count);

const now = new Date().toISOString().split("T")[0];
const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  .toISOString()
  .split("T")[0];

// ---------- Inventory (current-state)
const inventory = systems.map((s) => ({
  system_name: s,
  vendor: randomPick(vendors),
  domain: randomPick(domains),
  status: Math.random() > 0.5 ? "active" : "retiring",
  last_updated: now,
  dependencies: randomSubset(systems.filter((x) => x !== s), Math.ceil(Math.random() * 3)),
}));

// ---------- Future (target-state)
const future = systems.map((s) => {
  const isNext = Math.random() > 0.8;
  return {
    system_name: isNext ? `${s} vNext` : s,
    vendor: randomPick(vendors),
    domain: randomPick(domains),
    status: Math.random() > 0.5 ? "planned" : "active",
    target_date: nextYear,
    dependencies: randomSubset(systems.filter((x) => x !== s), Math.ceil(Math.random() * 3)),
  };
});

// ---------- Write files
fs.writeFileSync(
  path.join(INGESTED_PATH, "inventory_normalized.json"),
  JSON.stringify(inventory, null, 2)
);

fs.writeFileSync(
  path.join(INGESTED_PATH, "future_state.json"),
  JSON.stringify(future, null, 2)
);

console.log(`✅ Mock data generated successfully in ${INGESTED_PATH}`);