import { describe, expect, it } from "vitest";

import {
  renderShopifyHtml,
  richTextJsonToHtml,
  richTextJsonToPlainText,
  sanitizeRichTextHtml,
  validateRichTextDocument
} from "../src/index";

const documentJson = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Summer linen shirt" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Soft, breathable fabric with " },
        { type: "text", marks: [{ type: "bold" }], text: "free shipping" },
        { type: "text", text: "." }
      ]
    },
    {
      type: "image",
      attrs: {
        src: "https://cdn.shopify.com/s/files/1/0000/files/shirt.jpg",
        alt: "White linen shirt",
        title: "Shopify CDN image",
        shopifyFileId: "gid://shopify/MediaImage/123"
      }
    }
  ]
};

describe("rich text server", () => {
  it("validates the persisted rich text document envelope", () => {
    const richTextDocument = validateRichTextDocument({
      version: 1,
      schemaVersion: "2026-07",
      content: documentJson,
      plainText: "Summer linen shirt"
    });

    expect(richTextDocument.schemaVersion).toBe("2026-07");
    expect(richTextDocument.content.type).toBe("doc");
  });

  it("rejects invalid persisted document data", () => {
    expect(() =>
      validateRichTextDocument({
        version: 0,
        schemaVersion: "",
        content: { type: "paragraph" }
      })
    ).toThrow(/Invalid rich text document/);
  });

  it("renders Tiptap JSON into HTML and plain text", () => {
    expect(richTextJsonToHtml(documentJson)).toContain("<h2>Summer linen shirt</h2>");
    expect(richTextJsonToHtml(documentJson)).toContain("<strong>free shipping</strong>");
    expect(richTextJsonToPlainText(documentJson)).toBe(
      "Summer linen shirt\nSoft, breathable fabric with free shipping."
    );
  });

  it("sanitizes unsafe HTML with an allowlist", () => {
    const clean = sanitizeRichTextHtml(
      '<p onclick="alert(1)">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="https://cdn.shopify.com/a.jpg" onerror="alert(1)">'
    );

    expect(clean).toContain("<p>Hi</p>");
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("javascript:");
    expect(clean).not.toContain("onerror");
  });

  it("renders Shopify Product/Page HTML with editor metadata removed", () => {
    const html = renderShopifyHtml({
      version: 1,
      schemaVersion: "2026-07",
      content: documentJson
    });

    expect(html).toContain("<h2>Summer linen shirt</h2>");
    expect(html).toContain('src="https://cdn.shopify.com/s/files/1/0000/files/shirt.jpg"');
    expect(html).toContain('alt="White linen shirt"');
    expect(html).not.toContain("shopifyFileId");
    expect(html).not.toContain("data-editor");
  });
});

