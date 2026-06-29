import { describe, expect, it } from "vitest";
import {
  htmlToReadableMarkdown,
  isSafePublicHttpUrl,
} from "./fetch";

describe("web.fetch safety", () => {
  it("accepts public http(s) URLs without requiring a fixed host allowlist", () => {
    expect(isSafePublicHttpUrl("https://example.com/article")).toBe(true);
    expect(isSafePublicHttpUrl("http://example.com/article")).toBe(true);
  });

  it("blocks private, local, metadata, and non-http URLs", () => {
    expect(isSafePublicHttpUrl("http://localhost:3000")).toBe(false);
    expect(isSafePublicHttpUrl("http://127.0.0.1:3000")).toBe(false);
    expect(isSafePublicHttpUrl("http://10.0.0.2/admin")).toBe(false);
    expect(isSafePublicHttpUrl("http://172.16.0.10/admin")).toBe(false);
    expect(isSafePublicHttpUrl("http://192.168.1.5/admin")).toBe(false);
    expect(isSafePublicHttpUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafePublicHttpUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("web.fetch html cleaning", () => {
  it("extracts readable article Markdown and drops scripts/navigation", async () => {
    const result = await htmlToReadableMarkdown(
      `
        <!doctype html>
        <html>
          <head><title>Browser title</title><script>window.evil = true</script></head>
          <body>
            <nav>Navigation should disappear</nav>
            <article>
              <h1>Readable title</h1>
              <p>First useful paragraph.</p>
              <p>Second useful paragraph.</p>
            </article>
          </body>
        </html>
      `,
      "https://example.com/article"
    );

    expect(result.title).toBe("Readable title");
    expect(result.markdown).toContain("# Readable title");
    expect(result.markdown).toContain("First useful paragraph.");
    expect(result.markdown).not.toContain("Navigation should disappear");
    expect(result.markdown).not.toContain("window.evil");
  });
});
