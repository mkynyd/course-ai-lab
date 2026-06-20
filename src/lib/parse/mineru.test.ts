// @vitest-environment node

import AdmZip from "adm-zip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseFileWithMinerU } from "@/lib/parse/mineru";

describe("parseFileWithMinerU", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns normalized referenced image assets from the MinerU ZIP", async () => {
    const zip = new AdmZip();
    zip.addFile("result/full.md", Buffer.from("# 题目\n\n![电路](images/circuit.png)"));
    zip.addFile("result/images/circuit.png", Buffer.from([1, 2, 3]));
    const zipBuffer = zip.toBuffer();

    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/api/v4/file-urls/batch")) {
        return Response.json({
          code: 0,
          data: {
            batch_id: "batch-1",
            file_urls: ["https://upload.example/file"],
          },
        });
      }
      if (url === "https://upload.example/file") {
        return new Response(null, { status: 200 });
      }
      if (url.endsWith("/api/v4/extract-results/batch/batch-1")) {
        return Response.json({
          code: 0,
          data: {
            extract_result: [
              {
                state: "done",
                full_zip_url: "https://download.example/result.zip",
              },
            ],
          },
        });
      }
      if (url === "https://download.example/result.zip") {
        return new Response(new Uint8Array(zipBuffer), { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseFileWithMinerU({
      token: "token",
      fileBuffer: Buffer.from("pdf"),
      filename: "circuit.pdf",
    });

    expect(result.content).toContain("![电路](pics/circuit.png)");
    expect(result.assets).toEqual([
      {
        relativePath: "pics/circuit.png",
        mimeType: "image/png",
        buffer: Buffer.from([1, 2, 3]),
      },
    ]);
    expect(result.metadata.retainedImageCount).toBe(1);
  });
});
