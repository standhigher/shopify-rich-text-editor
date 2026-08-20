import { describe, expect, it } from "vitest";

import {
  collectChannelWarnings,
  getChannelCapability,
  shopifyHtmlCapabilities
} from "../src";

describe("channel capability matrix", () => {
  it("exposes callable capabilities for base nodes, marks and Shopify resources", () => {
    expect(getChannelCapability("shopify-html", "node", "paragraph")).toMatchObject({ support: "supported" });
    expect(getChannelCapability("shopify-html", "node", "shopifyResource")).toMatchObject({ support: "supported" });
    expect(getChannelCapability("shopify-html", "mark", "link")).toMatchObject({ support: "supported" });
    expect(shopifyHtmlCapabilities.nodes).toHaveProperty("image");
  });

  it("marks degraded Shopify HTML features explicitly", () => {
    expect(getChannelCapability("shopify-html", "node", "codeBlock")).toMatchObject({
      support: "degraded"
    });
    expect(getChannelCapability("shopify-html", "mark", "strike")).toMatchObject({
      support: "degraded"
    });
  });

  it("treats missing matrix entries as unsupported", () => {
    expect(getChannelCapability("shopify-html", "node", "customCallout")).toMatchObject({
      support: "unsupported"
    });
  });

  it("collects node and mark warnings from a document", () => {
    const warnings = collectChannelWarnings(
      {
        type: "doc",
        content: [
          { type: "codeBlock", content: [{ type: "text", text: "const x = 1;" }] },
          { type: "paragraph", content: [{ type: "text", text: "old", marks: [{ type: "strike" }] }] }
        ]
      },
      "shopify-html"
    );

    expect(warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CHANNEL_NODE_DEGRADED", path: "content.content[0]" }),
        expect.objectContaining({ code: "CHANNEL_MARK_DEGRADED", path: "content.content[1].content[0].marks[0]" })
      ])
    );
  });
});
