import { shopifyResourceFixtures } from "./shopify-resource-fixtures";

export const tiptapRichTextFixtures = {
  resourceDocument: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Featured product:" }] },
      {
        type: "shopifyResource",
        attrs: shopifyResourceFixtures.product
      }
    ]
  },
  supportedFormatting: {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "Fixture heading" }]
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "A " },
          { type: "text", text: "bold", marks: [{ type: "bold" }] },
          { type: "text", text: " link", marks: [{ type: "link", attrs: { href: "https://example.com" } }] }
        ]
      }
    ]
  }
} as const;

export const shopifyRichTextFixtures = {
  rootParagraph: {
    type: "root",
    children: [
      { type: "paragraph", children: [{ type: "text", value: "Fixture paragraph" }] }
    ]
  },
  rootList: {
    type: "root",
    children: [
      {
        type: "list",
        listType: "unordered",
        children: [
          { type: "list-item", children: [{ type: "text", value: "Fixture item" }] }
        ]
      }
    ]
  },
  unsupportedResource: {
    type: "root",
    children: [
      {
        type: "resource",
        resourceType: "product",
        id: shopifyResourceFixtures.product.id
      }
    ]
  }
} as const;
