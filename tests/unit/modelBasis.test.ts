import { describe, expect, it } from "vitest";
import { getModelMetadata } from "@/lib/modelBasis";

describe("model basis registry", () => {
  it("returns ROI model metadata", () => {
    const meta = getModelMetadata("roi_calculation");
    expect(meta?.modelName).toContain("ROI_Calculation");
    expect(meta?.inputs).toContain("Savings");
  });

  it("returns capability scoring model metadata", () => {
    const meta = getModelMetadata("capability_scoring");
    expect(meta?.modelType).toBe("Hybrid");
  });
});
