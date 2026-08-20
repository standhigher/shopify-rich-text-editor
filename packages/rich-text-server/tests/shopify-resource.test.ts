import { describe, expect, it } from "vitest";

import {
  createServerExtensionRegistry,
  renderShopifyHtml,
  richTextJsonToPlainText,
  validateRichTextDocument
} from "../src";
import {
  invalidShopifyResourceFixtures,
  shopifyResourceFixtures
} from "./fixtures/shopify-resource-fixtures";

const resourceDocument = (resource: Record<string, unknown>) => ({
  version: 1,
  schemaVersion: "2026-08",
  content: {
    type: "doc",
    content: [{ type: "shopifyResource", attrs: resource }]
  }
});

describe("Shopify resource node", () => {
  it("registers a native resource node on the server", () => {
    expect(createServerExtensionRegistry().nodeNames.has("shopifyResource")).toBe(true);
  });

  it.each([
    shopifyResourceFixtures.product,
    shopifyResourceFixtures.collection,
    shopifyResourceFixtures.variant
  ])("accepts a valid %s resource reference", (resource) => {
    expect(() => validateRichTextDocument(resourceDocument(resource))).not.toThrow();
  });

  it("accepts an unresolved reference without requiring a title", () => {
    expect(() => validateRichTextDocument(resourceDocument(shopifyResourceFixtures.unresolved))).not.toThrow();
  });

  it("renders a resource as safe text without leaking internal attrs", () => {
    const html = renderShopifyHtml(resourceDocument(shopifyResourceFixtures.product));

    expect(html).toContain("Fixture Product");
    expect(html).not.toContain("data-shopify-resource");
    expect(html).not.toContain("resourceType");
    expect(html).not.toContain("gid://shopify");
  });

  it("includes the resource title in plain text extraction", () => {
    expect(richTextJsonToPlainText(resourceDocument(shopifyResourceFixtures.product).content)).toBe(
      "Fixture Product"
    );
  });

  it("renders a configured safe resource link and image", () => {
    const html = renderShopifyHtml(resourceDocument(shopifyResourceFixtures.product), {
      resourceUrlBuilder: (resource) => `/${resource.resourceType}s/${resource.handle}`
    });

    expect(html).toContain('<a href="/products/fixture-product"');
    expect(html).toContain('<img src="https://cdn.shopify.com/s/files/fixture/product.png"');
    expect(html).not.toContain("data-resource-id");
  });

  it("falls back to text when a resource URL builder returns an unsafe URL", () => {
    const html = renderShopifyHtml(resourceDocument(shopifyResourceFixtures.product), {
      resourceUrlBuilder: () => "javascript:alert(1)"
    });

    expect(html).toContain("Fixture Product");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a");
  });

  it.each([
    invalidShopifyResourceFixtures.bareNumericId,
    invalidShopifyResourceFixtures.wrongTypeGid,
    invalidShopifyResourceFixtures.arbitraryObject
  ])("rejects an unsafe resource reference", (resource) => {
    expect(() => validateRichTextDocument(resourceDocument(resource))).toThrowError(
      expect.objectContaining({
        code: "INVALID_RESOURCE"
      })
    );
  });
});
