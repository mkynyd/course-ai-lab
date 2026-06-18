import { describe, expect, it } from "vitest";
import { routeModel } from "@/lib/chat/router";

describe("routeModel", () => {
  it("locks to MiniMax when project context requires vision reasoning", () => {
    expect(routeModel(null, [], { requiresVisionModel: true })).toEqual({
      provider: "minimax",
      shouldLock: true,
    });
  });

  it("routes to MiniMax when the user explicitly selects MiniMax M3 without forcing a lock", () => {
    expect(routeModel(null, [], { requestedModel: "minimax-m3" })).toEqual({
      provider: "minimax",
      shouldLock: false,
    });
  });
});
