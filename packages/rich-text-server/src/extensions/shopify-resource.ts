import { Node } from "@tiptap/core";
import type { RichTextNode } from "@standhigher/shopify-rich-text-core";

import {
  renderShopifyResource,
  type ShopifyResourceRenderOptions
} from "../channels/resource-renderer";

export const shopifyResourceServerExtension = Node.create({
  name: "shopifyResource",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      resourceType: { default: null },
      id: { default: null },
      title: { default: null },
      handle: { default: null },
      image: { default: null }
    };
  },
  addOptions(): ShopifyResourceRenderOptions {
    return {};
  },
  parseHTML: () => [{ tag: "div[data-shopify-resource]" }],
  renderHTML({ node }) {
    return renderShopifyResource(node.toJSON() as RichTextNode, this.options);
  }
});
