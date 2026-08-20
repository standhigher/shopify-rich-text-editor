import { describe, expect, it } from "vitest";

import { createRichTextDocument } from "../../packages/rich-text-core/src";
import { processRichText, validateRichTextDocument } from "../../packages/rich-text-server/src";

describe("minimum cross-package content lifecycle", () => {
  it("wraps editor content, validates it, and produces Shopify HTML and read-only text", () => {
    const document = createRichTextDocument({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Stable content" }] }]
    });

    const validated = validateRichTextDocument(document);
    const result = processRichText(validated, { channel: "shopify-html" });

    expect(validated.version).toBe(1);
    expect(result).toMatchObject({ ok: true, plainText: "Stable content", warnings: [] });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.html).toContain("<p>Stable content</p>");
  });
});
