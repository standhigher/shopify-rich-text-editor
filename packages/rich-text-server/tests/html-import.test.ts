import { describe, expect, it } from "vitest";

import { CURRENT_RICH_TEXT_SCHEMA_VERSION, importStandardHtml } from "../src";

describe("standard HTML import", () => {
  it("imports supported block and inline HTML into a valid rich text document", () => {
    const result = importStandardHtml("<h2>Title</h2><p>Hello <strong>bold</strong> and <u>underlined</u>.</p>");

    expect(result.ok).toBe(true);
    expect(result.document.schemaVersion).toBe(CURRENT_RICH_TEXT_SCHEMA_VERSION);
    expect(result.document.content).toMatchObject({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 } },
        { type: "paragraph" }
      ]
    });
    expect(result.warnings).toEqual([]);
  });

  it("normalizes empty paragraphs, meaningless spans, heading levels and nested lists", () => {
    const result = importStandardHtml(
      '<p><span style="font-size: 16px">First</span></p><h6>Small</h6><ul><li>One<ol><li>Nested</li></ol></li></ul><p><br></p>'
    );

    expect(result.ok).toBe(true);
    expect(result.document.content.content?.[1]).toMatchObject({ type: "heading", attrs: { level: 4 } });
    expect(result.document.content.content?.some((node) => node.type === "bulletList")).toBe(true);
    expect(JSON.stringify(result.document.content)).not.toContain("font-size");
  });

  it("imports safe links and images", () => {
    const result = importStandardHtml(
      '<p><a href="https://example.com">Shop</a></p><img src="https://cdn.shopify.com/image.jpg" alt="Image">'
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.document.content)).toContain("https://example.com");
    expect(JSON.stringify(result.document.content)).toContain("https://cdn.shopify.com/image.jpg");
  });

  it("removes dangerous tags, event attributes and dangerous URLs with warnings", () => {
    const result = importStandardHtml(
      '<p onclick="alert(1)">Hi<script>alert(1)</script><a href="javascript:alert(1)">bad</a><img src="data:text/html,bad"></p><iframe src="https://example.com"></iframe>'
    );

    expect(result.ok).toBe(true);
    expect(result.warnings.map((warning) => warning.code)).toContain("HTML_SANITIZED");
    expect(result.warnings.map((warning) => warning.code)).toContain("UNSUPPORTED_HTML");
    expect(JSON.stringify(result.document.content)).not.toContain("javascript:");
    expect(JSON.stringify(result.document.content)).not.toContain("data:text");
    expect(JSON.stringify(result.document.content)).not.toContain("iframe");
  });

  it("returns a structured error when HTML cannot produce a valid document", () => {
    const result = importStandardHtml("<form><input name=\"title\"></form>");

    expect(result).toMatchObject({
      ok: false,
      error: { code: "EMPTY_IMPORT" }
    });
  });
});
