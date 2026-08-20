import { describe, expect, it } from "vitest";

import { processRichText, sanitizeRichTextHtml, validateRichTextDocument } from "../../packages/rich-text-server/src";
import { createDeepDocument, maliciousDocuments, oversizedDocument } from "../fixtures/security/malicious-documents";

describe("1.0 security regression fixtures", () => {
  it("escapes script text and strips event attributes from rendered HTML", () => {
    const scriptResult = processRichText(maliciousDocuments.scriptText);
    const eventResult = processRichText(maliciousDocuments.eventAttributes);

    expect(scriptResult.ok).toBe(true);
    expect(eventResult.ok).toBe(true);
    if (!scriptResult.ok || !eventResult.ok) throw new Error("fixture processing failed");
    expect(scriptResult.html).not.toContain("<script>");
    expect(eventResult.html).not.toContain("onerror");
  });

  it("rejects dangerous URLs, forged resource attributes, oversized documents, and deep nesting", () => {
    expect(() => validateRichTextDocument(maliciousDocuments.dangerousLink)).toThrowError(
      expect.objectContaining({ code: "UNSAFE_URL" })
    );
    expect(() => validateRichTextDocument(maliciousDocuments.forgedResource)).toThrowError(
      expect.objectContaining({ code: "INVALID_RESOURCE" })
    );
    expect(() => validateRichTextDocument(oversizedDocument)).toThrowError(
      expect.objectContaining({ code: "DOCUMENT_TOO_LARGE" })
    );
    expect(() => validateRichTextDocument(createDeepDocument(100))).toThrowError(
      expect.objectContaining({ code: "DOCUMENT_TOO_DEEP" })
    );
  });

  it("keeps the sanitizer allowlist as the final HTML boundary", () => {
    expect(sanitizeRichTextHtml('<p>ok</p><iframe src="https://evil.example"></iframe>')).toBe("<p>ok</p>");
  });
});
