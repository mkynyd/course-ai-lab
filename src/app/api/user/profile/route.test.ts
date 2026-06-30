import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

import { GET, PATCH } from "./route";

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/user/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.userFindUnique.mockResolvedValue({
      email: "student@example.com",
      name: "YJH",
      avatarPreset: "code",
    });
    mocks.userUpdate.mockResolvedValue({
      email: "student@example.com",
      name: "殷浚航",
      avatarPreset: "study",
    });
  });

  it("returns the current profile for the authenticated user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "student@example.com",
      name: "YJH",
      avatarPreset: "code",
    });
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true, name: true, avatarPreset: true },
    });
  });

  it("updates name and avatar preset", async () => {
    const response = await PATCH(
      makePatchRequest({ name: "  殷浚航  ", avatarPreset: "study" })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      email: "student@example.com",
      name: "殷浚航",
      avatarPreset: "study",
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "殷浚航", avatarPreset: "study" },
      select: { email: true, name: true, avatarPreset: true },
    });
  });

  it("clears blank names", async () => {
    await PATCH(makePatchRequest({ name: " ", avatarPreset: "lumen" }));

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: null, avatarPreset: "lumen" },
      })
    );
  });

  it("rejects invalid avatar presets", async () => {
    const response = await PATCH(
      makePatchRequest({ name: "YJH", avatarPreset: "custom" })
    );

    expect(response.status).toBe(400);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect((await PATCH(makePatchRequest({ name: "YJH" }))).status).toBe(401);
  });
});
