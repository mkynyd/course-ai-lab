import { describe, expect, it } from "vitest";
import { registerSchema, sendMessageSchema } from "@/lib/validators";

describe("registerSchema", () => {
  it("requires a registration code", () => {
    expect(
      registerSchema.parse({
        email: "alpha@example.com",
        password: "password123",
        registrationCode: "ALPHA-7X9P",
      })
    ).toEqual({
      email: "alpha@example.com",
      password: "password123",
      registrationCode: "ALPHA-7X9P",
    });

    expect(() =>
      registerSchema.parse({
        email: "alpha@example.com",
        password: "password123",
      })
    ).toThrow();
  });
});

describe("sendMessageSchema", () => {
  it("defaults project chat requests to thinking mode", () => {
    expect(
      sendMessageSchema.parse({
        message: "总结资料",
        model: "deepseek-v4-pro",
      })
    ).toMatchObject({
      thinkingEnabled: true,
      reasoningEffort: "high",
    });
  });

  it("allows explicit MiniMax M3 selection", () => {
    expect(
      sendMessageSchema.parse({
        message: "分析图片资料",
        model: "minimax-m3",
      })
    ).toMatchObject({
      model: "minimax-m3",
      thinkingEnabled: true,
    });
  });
});
