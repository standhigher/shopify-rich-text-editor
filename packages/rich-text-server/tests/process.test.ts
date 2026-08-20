import { describe, expect, it } from "vitest";

import {
  CURRENT_RICH_TEXT_SCHEMA_VERSION,
  processRichText,
  renderShopifyHtml
} from "../src";

const document = {
  version: 1,
  schemaVersion: "2026-07",
  content: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
      { type: "paragraph", content: [{ type: "text", text: "Body" }] }
    ]
  }
};

describe("rich text processing pipeline", () => {
  it("validates, migrates, serializes, adapts and sanitizes Shopify HTML", () => {
    const result = processRichText(document, { channel: "shopify-html" });

    expect(result).toMatchObject({
      ok: true,
      channel: "shopify-html",
      schemaVersion: CURRENT_RICH_TEXT_SCHEMA_VERSION,
      plainText: "Title\nBody",
      warnings: []
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.html).toContain("<h2>Title</h2>");
    expect(result.html).toContain("<p>Body</p>");
  });

  it("keeps renderShopifyHtml as a compatible HTML string API", () => {
    expect(renderShopifyHtml(document)).toContain("<h2>Title</h2>");
  });

  it("returns explicit warnings for nodes that Shopify HTML degrades", () => {
    const result = processRichText(
      {
        version: 1,
        schemaVersion: CURRENT_RICH_TEXT_SCHEMA_VERSION,
        content: {
          type: "doc",
          content: [{ type: "codeBlock", content: [{ type: "text", text: "const x = 1;" }] }]
        }
      },
      { channel: "shopify-html" }
    );

    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "CHANNEL_NODE_DEGRADED",
          path: "content.content[0]"
        })
      ])
    );
  });

  it("returns structured errors without exposing raw exceptions as the stable API", () => {
    const result = processRichText({ version: 1, schemaVersion: "2025-01", content: { type: "doc" } });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "MIGRATION_FAILED" },
      channel: "shopify-html"
    });
  });
});
