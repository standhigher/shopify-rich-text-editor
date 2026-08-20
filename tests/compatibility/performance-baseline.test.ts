import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { createRichTextDocument } from "../../packages/rich-text-core/src";
import { processRichText } from "../../packages/rich-text-server/src";

function createDocument(targetBytes: number) {
  const text = "x".repeat(Math.max(1, targetBytes - 180));
  return createRichTextDocument({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
}

describe("repeatable 1.0 performance baseline", () => {
  it.each([10_000, 50_000, 100_000])("processes a roughly %s byte document within the baseline", (targetBytes) => {
    const document = createDocument(targetBytes);
    const start = performance.now();
    const result = processRichText(document);
    const elapsedMs = performance.now() - start;

    expect(result.ok).toBe(true);
    expect(JSON.stringify(document).length).toBeGreaterThan(targetBytes * 0.8);
    expect(elapsedMs).toBeLessThan(1_000);
    console.log(JSON.stringify({ targetBytes, elapsedMs: Number(elapsedMs.toFixed(2)), node: process.version }));
  });
});
