import { afterEach, describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";

import {
  createEditorConfig,
  createEditorExtensionRegistry
} from "../src/create-editor";

const product = {
  resourceType: "product" as const,
  id: "gid://shopify/Product/100000000001",
  title: "Fixture Product",
  handle: "fixture-product"
};

let editor: Editor | undefined;

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

describe("Shopify resource editor extension", () => {
  it("registers the resource node with the base editor", () => {
    expect(createEditorExtensionRegistry().nodeNames.has("shopifyResource")).toBe(true);
  });

  it("inserts a resource reference through a typed editor command", () => {
    editor = new Editor(createEditorConfig({
      content: { type: "doc", content: [] },
      onUpdate: () => undefined
    }));

    expect(editor.commands.insertShopifyResource(product)).toBe(true);
    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: "shopifyResource",
      attrs: product
    });
  });

  it("keeps unresolved resources as resource nodes", () => {
    editor = new Editor(createEditorConfig({
      content: {
        type: "doc",
        content: [{
          type: "shopifyResource",
          attrs: { resourceType: "collection", id: "gid://shopify/Collection/200000000099" }
        }]
      },
      onUpdate: () => undefined
    }));

    expect(editor.getJSON().content?.[0]).toMatchObject({
      type: "shopifyResource",
      attrs: {
        resourceType: "collection",
        id: "gid://shopify/Collection/200000000099"
      }
    });
  });
});
