import { describe, expect, it } from "vitest";
import {
  getDotObstacleFade,
  shouldContinueAmbientFrame,
} from "@/components/workbench/ambient-field";

describe("shouldContinueAmbientFrame", () => {
  it("stops idle canvas animation after the pointer pulse completes", () => {
    expect(shouldContinueAmbientFrame(100, 500, false)).toBe(true);
    expect(shouldContinueAmbientFrame(100, 741, false)).toBe(false);
  });

  it("never continues animation when reduced motion is requested", () => {
    expect(shouldContinueAmbientFrame(100, 200, true)).toBe(false);
  });
});

describe("getDotObstacleFade", () => {
  const obstacle = [{ left: 40, top: 40, right: 80, bottom: 80 }];

  it("keeps distant dots at full strength", () => {
    expect(getDotObstacleFade({ x: 200, y: 200 }, obstacle)).toBe(1);
  });

  it("softens dots inside the content boundary instead of removing them", () => {
    const fade = getDotObstacleFade({ x: 60, y: 60 }, obstacle);

    expect(fade).toBeGreaterThan(0);
    expect(fade).toBeLessThan(0.2);
  });

  it("ramps dots back toward full strength near the content boundary", () => {
    const near = getDotObstacleFade({ x: 88, y: 60 }, obstacle);
    const farther = getDotObstacleFade({ x: 126, y: 60 }, obstacle);

    expect(near).toBeGreaterThan(0.14);
    expect(farther).toBeGreaterThan(near);
    expect(farther).toBeLessThan(1);
  });
});
