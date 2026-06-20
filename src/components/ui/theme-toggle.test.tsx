import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/ui/theme-toggle";

vi.mock("@/components/ui/theme-provider", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

describe("ThemeToggle", () => {
  it("renders a stable system selection before the client theme mounts", () => {
    const html = renderToString(<ThemeToggle />);

    expect(html).toMatch(/aria-checked="true" aria-label="自动"/);
    expect(html).toMatch(/aria-checked="false" aria-label="深色"/);
  });
});
