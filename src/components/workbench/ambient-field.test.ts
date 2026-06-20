import { describe, expect, it } from "vitest";
import { shouldContinueAmbientFrame } from "@/components/workbench/ambient-field";

describe("shouldContinueAmbientFrame", () => {
  it("stops idle canvas animation after the pointer pulse completes", () => {
    expect(shouldContinueAmbientFrame(100, 500, false)).toBe(true);
    expect(shouldContinueAmbientFrame(100, 741, false)).toBe(false);
  });

  it("never continues animation when reduced motion is requested", () => {
    expect(shouldContinueAmbientFrame(100, 200, true)).toBe(false);
  });
});
