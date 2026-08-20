import { describe, expect, it } from "vitest";
import { Node } from "@tiptap/core";

import {
  createServerExtensionRegistry,
  richTextJsonToHtml,
  richTextJsonToPlainText,
  validateRichTextDocument,
  type ServerExtension
} from "../src";

const calloutExtension = (): ServerExtension => ({
  id: "callout",
  version: "1.0.0",
  nodes: ["callout"],
  server: {
    extensions: [Node.create({
      name: "callout",
      group: "block",
      content: "inline*",
      parseHTML: () => [{ tag: "aside[data-callout]" }],
      renderHTML: ({ HTMLAttributes }) => ["aside", { ...HTMLAttributes, "data-callout": "true" }, 0]
    })],
    serializers: {
      callout: (node) => `<aside data-callout="true">${node.content?.map((child) => child.text ?? "").join("") ?? ""}</aside>`
    },
    plainTextSerializers: {
      callout: (node) => `Callout: ${node.content?.map((child) => child.text ?? "").join("") ?? ""}`
    }
  }
});

const calloutDocument = {
  type: "doc",
  content: [{ type: "callout", content: [{ type: "text", text: "Important" }] }]
};

describe("server extension registry", () => {
  it("keeps the base server extensions by default", () => {
    const registry = createServerExtensionRegistry();

    expect(registry.nodeNames.has("paragraph")).toBe(true);
    expect(registry.markNames.has("bold")).toBe(true);
    expect(registry.serverExtensions.length).toBeGreaterThan(0);
  });

  it("accepts and renders a node registered on the server", () => {
    const extension = calloutExtension();
    const registry = createServerExtensionRegistry([extension]);

    expect(() => validateRichTextDocument({ version: 1, schemaVersion: "2026-08", content: calloutDocument }, {}, registry))
      .not.toThrow();
    expect(richTextJsonToHtml(calloutDocument, [extension])).toContain('data-callout="true"');
    expect(richTextJsonToPlainText(calloutDocument, [extension])).toBe("Callout: Important");
  });

  it("rejects a node when the server extension is not registered", () => {
    expect(() => validateRichTextDocument({ version: 1, schemaVersion: "2026-08", content: calloutDocument }))
      .toThrowError(expect.objectContaining({ code: "UNKNOWN_NODE" }));
  });
});
