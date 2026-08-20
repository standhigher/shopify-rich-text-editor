import { describe, expect, it } from "vitest";

import {
  RICH_TEXT_VALIDATION_LIMITS,
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

  it("rejects unknown node types with a structured validation error", () => {
    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        content: { type: "doc", content: [{ type: "unknownNode" }] }
      })
    ).toThrowError(
      expect.objectContaining({
        name: "RichTextValidationError",
        code: "UNKNOWN_NODE"
      })
    );
  });

  it("rejects unknown mark types with a structured validation error", () => {
    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Hi", marks: [{ type: "unknownMark" }] }] }]
        }
      })
    ).toThrowError(
      expect.objectContaining({
        name: "RichTextValidationError",
        code: "UNKNOWN_MARK"
      })
    );
  });

  it("rejects dangerous URLs in links and images", () => {
    for (const content of [
      { type: "paragraph", content: [{ type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] },
      { type: "image", attrs: { src: "data:text/html,<script>alert(1)</script>" } }
    ]) {
      expect(() =>
        validateRichTextDocument({ version: 1, schemaVersion: "2026-07", content: { type: "doc", content: [content] } })
      ).toThrowError(expect.objectContaining({ name: "RichTextValidationError", code: "UNSAFE_URL" }));
    }
  });

  it("rejects documents exceeding the configured size limit", () => {
    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(100_001) }] }] }
      })
    ).toThrowError(expect.objectContaining({ code: "DOCUMENT_TOO_LARGE" }));
  });

  it("counts document size using UTF-8 bytes", () => {
    const document = {
      version: 1,
      schemaVersion: "2026-07",
      content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "你".repeat(100) }] }] }
    };
    const serialized = JSON.stringify(document);
    const characterLength = serialized.length;
    const byteLength = new TextEncoder().encode(serialized).length;

    expect(byteLength).toBeGreaterThan(characterLength);
    expect(() => validateRichTextDocument(document, { maxDocumentBytes: characterLength + 1 })).toThrowError(
      expect.objectContaining({ code: "DOCUMENT_TOO_LARGE" })
    );
  });

  it("rejects documents exceeding the node count limit with a structured error", () => {
    expect(() =>
      validateRichTextDocument(
        {
          version: 1,
          schemaVersion: "2026-07",
          content: { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] }
        },
        { maxNodeCount: 2 }
      )
    ).toThrowError(expect.objectContaining({ code: "DOCUMENT_TOO_LARGE" }));
  });

  it("rejects documents exceeding the attrs count limit with a structured error", () => {
    expect(() =>
      validateRichTextDocument(
        {
          version: 1,
          schemaVersion: "2026-07",
          content: { type: "doc", content: [{ type: "heading", attrs: { level: 2, align: "center" } }] }
        },
        { maxAttrsCount: 1 }
      )
    ).toThrowError(expect.objectContaining({ code: "DOCUMENT_TOO_LARGE" }));
  });

  it("allows callers to override validation limits without changing defaults", () => {
    expect(RICH_TEXT_VALIDATION_LIMITS.maxNodeCount).toBeGreaterThan(2);
    expect(() =>
      validateRichTextDocument(
        {
          version: 1,
          schemaVersion: "2026-07",
          content: { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] }
        },
        { maxNodeCount: 2 }
      )
    ).toThrow();
    expect(() =>
      validateRichTextDocument(
        {
          version: 1,
          schemaVersion: "2026-07",
          content: { type: "doc", content: [{ type: "paragraph" }, { type: "paragraph" }] }
        },
        { maxNodeCount: 3 }
      )
    ).not.toThrow();
  });

  it("rejects documents exceeding the configured nesting limit", () => {
    let content: Record<string, unknown> = { type: "paragraph", content: [{ type: "text", text: "x" }] };
    for (let index = 0; index < 100; index += 1) {
      content = { type: "blockquote", content: [content] };
    }

    expect(() =>
      validateRichTextDocument({ version: 1, schemaVersion: "2026-07", content: { type: "doc", content: [content] } })
    ).toThrowError(expect.objectContaining({ code: "DOCUMENT_TOO_DEEP" }));
  });

  it("accepts a legal complex nested list", () => {
    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        content: {
          type: "doc",
          content: [
            {
              type: "bulletList",
              content: [
                { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] },
                {
                  type: "listItem",
                  content: [
                    { type: "paragraph", content: [{ type: "text", text: "two" }] },
                    { type: "orderedList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "nested" }] }] }] }
                  ]
                }
              ]
            }
          ]
        }
      })
    ).not.toThrow();
  });

  it("does not double count a plain text cache when enforcing text limits", () => {
    const text = "x".repeat(60_000);

    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        plainText: text,
        content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }
      })
    ).not.toThrow();
  });

  it("rejects unsupported link protocols", () => {
    expect(() =>
      validateRichTextDocument({
        version: 1,
        schemaVersion: "2026-07",
        content: {
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: "link", marks: [{ type: "link", attrs: { href: "ftp://example.com" } }] }] }]
        }
      })
    ).toThrowError(expect.objectContaining({ code: "UNSAFE_URL" }));
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
