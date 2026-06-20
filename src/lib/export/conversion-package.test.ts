// @vitest-environment node

import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { buildConversionPackage } from "@/lib/export/conversion-package";

const ONE_PIXEL_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

describe("buildConversionPackage", () => {
  it("creates one sanitized root with Markdown, PDF, DOCX, and pics", async () => {
    const pdf = Buffer.from("%PDF-test");
    const buffer = await buildConversionPackage({
      baseName: "电路原理/高分精选",
      markdownContent: "# 电路\n\n![电路图](pics/circuit.png)",
      pdfBuffer: pdf,
      assets: [
        {
          relativePath: "pics/circuit.png",
          mimeType: "image/png",
          buffer: ONE_PIXEL_PNG,
        },
      ],
    });
    const zip = new AdmZip(buffer);
    const root = "电路原理-高分精选";

    expect(zip.getEntry(`${root}/${root}.md`)?.getData().toString()).toContain(
      "pics/circuit.png"
    );
    expect(zip.getEntry(`${root}/${root}.pdf`)?.getData()).toEqual(pdf);
    expect(zip.getEntry(`${root}/${root}.docx`)?.getData().subarray(0, 2).toString()).toBe("PK");
    expect(zip.getEntry(`${root}/pics/circuit.png`)?.getData()).toEqual(
      ONE_PIXEL_PNG
    );
  });
});
