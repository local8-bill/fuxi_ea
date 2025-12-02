import { describe, expect, it } from "vitest";
import { loadVerificationData } from "@/lib/verification/data";

describe("verification data loader", () => {
  it("parses directives from docs/features", async () => {
    const { directives } = await loadVerificationData();
    expect(directives.length).toBeGreaterThan(0);
    expect(directives[0]).toHaveProperty("id");
  });
});
