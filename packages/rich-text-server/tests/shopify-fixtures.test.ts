import { describe, expect, it } from "vitest";

import {
  invalidShopifyResourceFixtures,
  shopifyResourceFixtures
} from "./fixtures/shopify-resource-fixtures";
import {
  shopifyRichTextFixtures,
  tiptapRichTextFixtures
} from "./fixtures/shopify-rich-text-fixtures";

describe("Shopify 0.5.x fixtures", () => {
  it("uses stable GIDs for the supported resource types", () => {
    expect(shopifyResourceFixtures.product.id).toMatch(/^gid:\/\/shopify\/Product\/\d+$/);
    expect(shopifyResourceFixtures.collection.id).toMatch(/^gid:\/\/shopify\/Collection\/\d+$/);
    expect(shopifyResourceFixtures.variant.id).toMatch(/^gid:\/\/shopify\/ProductVariant\/\d+$/);
  });

  it("keeps the valid resource snapshot limited to public display fields", () => {
    for (const resource of Object.values(shopifyResourceFixtures)) {
      expect(Object.keys(resource).sort()).toEqual(
        expect.arrayContaining(["resourceType", "id"])
      );
      expect(Object.keys(resource)).not.toContain("apiResponse");
      expect(Object.keys(resource)).not.toContain("accessToken");
    }

    expect(invalidShopifyResourceFixtures.arbitraryObject.apiResponse).toEqual(
      expect.objectContaining({ accessToken: expect.any(String) })
    );
  });

  it("provides reusable Tiptap and Shopify rich text document fixtures", () => {
    expect(tiptapRichTextFixtures.resourceDocument.type).toBe("doc");
    expect(tiptapRichTextFixtures.resourceDocument.content?.[1]).toMatchObject({
      type: "shopifyResource",
      attrs: shopifyResourceFixtures.product
    });
    expect(shopifyRichTextFixtures.rootParagraph.type).toBe("root");
    expect(shopifyRichTextFixtures.rootList.children[0]?.type).toBe("list");
    expect(shopifyRichTextFixtures.unsupportedResource.children[0]?.type).toBe("resource");
  });
});
