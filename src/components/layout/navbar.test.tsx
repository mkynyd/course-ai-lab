import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/layout/navbar";

describe("Navbar", () => {
  it("announces the closed mobile navigation independently of desktop collapse", () => {
    render(
      <Navbar
        onMenuToggle={vi.fn()}
        sidebarCollapsed={false}
        mobileSidebarOpen={false}
      />
    );

    expect(screen.getByRole("button", { name: "打开导航" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });
});
