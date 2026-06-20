// @vitest-environment node

import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { extractMinerUResult } from "@/lib/parse/mineru-result";

function zipBuffer(entries: Record<string, string | Buffer>) {
  const zip = new AdmZip();
  for (const [name, value] of Object.entries(entries)) {
    zip.addFile(name, Buffer.isBuffer(value) ? value : Buffer.from(value));
  }
  return zip.toBuffer();
}

describe("extractMinerUResult", () => {
  it("extracts only referenced images and rewrites them into pics", () => {
    const result = extractMinerUResult(
      zipBuffer({
        "result/full.md": [
          "# 电路题",
          "",
          "![串联电路](images/circuit.png)",
          '<img src="../shared/circuit.png" alt="并联电路">',
          "![外链](https://example.com/external.png)",
        ].join("\n"),
        "result/images/circuit.png": Buffer.from([1, 2, 3]),
        "shared/circuit.png": Buffer.from([4, 5, 6]),
        "result/images/unreferenced.png": Buffer.from([7, 8, 9]),
      })
    );

    expect(result.content).toContain("![串联电路](pics/circuit.png)");
    expect(result.content).toMatch(
      /<img src="pics\/circuit-[a-f0-9]{8}\.png" alt="并联电路">/
    );
    expect(result.content).toContain(
      "![外链](https://example.com/external.png)"
    );
    expect(result.assets).toHaveLength(2);
    expect(result.assets[0]).toEqual({
      relativePath: "pics/circuit.png",
      mimeType: "image/png",
      buffer: Buffer.from([1, 2, 3]),
    });
    expect(result.assets[1]).toEqual(
      expect.objectContaining({
        relativePath: expect.stringMatching(/^pics\/circuit-[a-f0-9]{8}\.png$/),
        mimeType: "image/png",
        buffer: Buffer.from([4, 5, 6]),
      })
    );
  });

  it("rejects a missing internal image", () => {
    expect(() =>
      extractMinerUResult(
        zipBuffer({
          "result/full.md": "![缺失](images/missing.png)",
        })
      )
    ).toThrow("MinerU 结果缺少图片：images/missing.png");
  });

  it("rejects an image path that escapes the ZIP root", () => {
    expect(() =>
      extractMinerUResult(
        zipBuffer({
          "full.md": "![越界](../../secret.png)",
          "secret.png": Buffer.from([1]),
        })
      )
    ).toThrow("MinerU 图片路径无效：../../secret.png");
  });

  it("keeps data URLs without creating stored assets", () => {
    const result = extractMinerUResult(
      zipBuffer({
        "full.md": "![内嵌](data:image/png;base64,AQID)",
      })
    );

    expect(result.content).toBe("![内嵌](data:image/png;base64,AQID)");
    expect(result.assets).toEqual([]);
  });
});
