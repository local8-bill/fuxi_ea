import type { Capability } from "@/domain/model/capability";

export const DEMO_SEED: Capability[] = [
  {
    id: "cap-om",
    name: "Order Management",
    level: "L1",
    domain: "Core Ops",
    children: [
      {
        id: "cap-om-intake",
        name: "Order Intake",
        level: "L2",
        children: [
          {
            id: "cap-om-cart",
            name: "Cart & Checkout",
            level: "L3",
            scores: {
              opportunity: 0.7,
              maturity: 0.4,
              techFit: 0.6,
              strategicAlignment: 0.8,
              peopleReadiness: 0.5,
            },
          },
          {
            id: "cap-om-pricing",
            name: "Pricing & Promotions",
            level: "L3",
            scores: {
              opportunity: 0.6,
              maturity: 0.5,
              techFit: 0.5,
              strategicAlignment: 0.7,
              peopleReadiness: 0.5,
            },
          },
        ],
      },
      {
        id: "cap-om-fulfill",
        name: "Fulfillment",
        level: "L2",
        children: [
          {
            id: "cap-om-alloc",
            name: "Allocation",
            level: "L3",
            scores: {
              opportunity: 0.5,
              maturity: 0.6,
              techFit: 0.5,
              strategicAlignment: 0.6,
              peopleReadiness: 0.6,
            },
          },
          {
            id: "cap-om-pickpack",
            name: "Pick/Pack/Ship",
            level: "L3",
            scores: {
              opportunity: 0.6,
              maturity: 0.5,
              techFit: 0.6,
              strategicAlignment: 0.7,
              peopleReadiness: 0.6,
            },
          },
        ],
      },
    ],
  },
  {
    id: "cap-prod",
    name: "Product Discovery",
    level: "L1",
    domain: "Strategy",
    children: [
      {
        id: "cap-prod-research",
        name: "Research",
        level: "L2",
        children: [
          {
            id: "cap-prod-insights",
            name: "Customer Insights",
            level: "L3",
            scores: {
              opportunity: 0.8,
              maturity: 0.5,
              techFit: 0.6,
              strategicAlignment: 0.9,
              peopleReadiness: 0.5,
            },
          },
        ],
      },
    ],
  },
];