import { Capability } from "@/types/capability";

export const seed: Capability[] = [
  { id: "l1-dtc-commerce", domain: "DTC", level: "L1", l1: "Commerce", name: "DTC > Commerce" },
  { id: "l1-sc-fulfillment", domain: "Supply Chain", level: "L1", l1: "Fulfillment", name: "Supply Chain > Fulfillment" },

  { id: "l2-checkout", parentId: "l1-dtc-commerce", domain: "DTC", level: "L2", l1: "Commerce", l2: "Checkout",
    name: "DTC > Commerce > Checkout",
    scores: { maturity:3, techFit:2, strategicAlignment:5, peopleReadiness:3, opportunity:5 } },
  { id: "l2-orchestration", parentId: "l1-sc-fulfillment", domain: "Supply Chain", level: "L2", l1: "Fulfillment", l2: "Order Orchestration",
    name: "Supply Chain > Fulfillment > Order Orchestration",
    scores: { maturity:2, techFit:2, strategicAlignment:4, peopleReadiness:3, opportunity:4 } },

  { id: "l3-payments", parentId: "l2-checkout", domain: "DTC", level: "L3", l1:"Commerce", l2:"Checkout", l3:"Payments",
    name: "DTC > Commerce > Checkout > Payments",
    scores: { maturity:2, techFit:2, strategicAlignment:5, peopleReadiness:2, opportunity:5 } },
  { id: "l3-tax", parentId: "l2-checkout", domain: "DTC", level: "L3", l1:"Commerce", l2:"Checkout", l3:"Tax",
    name: "DTC > Commerce > Checkout > Tax",
    scores: { maturity:3, techFit:3, strategicAlignment:4, peopleReadiness:3, opportunity:4 } },

  { id: "l3-sourcing", parentId: "l2-orchestration", domain: "Supply Chain", level: "L3", l1:"Fulfillment", l2:"Order Orchestration", l3:"Sourcing",
    name: "Supply Chain > Fulfillment > Order Orchestration > Sourcing",
    scores: { maturity:2, techFit:2, strategicAlignment:4, peopleReadiness:3, opportunity:4 } },
];
