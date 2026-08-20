import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import type { ResourceReference } from "@standhigher/shopify-rich-text-core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    shopifyResource: {
      insertShopifyResource: (resource: ResourceReference) => ReturnType;
    };
  }
}

export const shopifyResourceExtension = Node.create({
  name: "shopifyResource",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      resourceType: { default: null },
      id: { default: null },
      title: { default: null },
      handle: { default: null },
      image: { default: null }
    };
  },
  parseHTML: () => [{
    tag: "div[data-shopify-resource]",
    getAttrs: (element) => {
      const node = element as HTMLElement;
      return {
        resourceType: node.dataset.resourceType ?? null,
        id: node.dataset.resourceId ?? null,
        title: node.dataset.resourceTitle ?? null,
        handle: node.dataset.resourceHandle ?? null,
        image: node.dataset.resourceImage ?? null
      };
    }
  }],
  renderHTML: ({ node, HTMLAttributes }) => [
    "div",
    mergeAttributes(HTMLAttributes, {
      "data-shopify-resource": "true",
      "data-resource-type": node.attrs.resourceType,
      "data-resource-id": node.attrs.id,
      "data-resource-title": node.attrs.title,
      "data-resource-handle": node.attrs.handle,
      "data-resource-image": node.attrs.image
    }),
    node.attrs.title ?? node.attrs.id ?? "Unavailable Shopify resource"
  ],
  addCommands() {
    return {
      insertShopifyResource:
        (resource: ResourceReference) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: resource
          })
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ShopifyResourceNodeView);
  }
});

function ShopifyResourceNodeView({ node }: NodeViewProps) {
  const title = typeof node.attrs.title === "string" && node.attrs.title.length > 0
    ? node.attrs.title
    : "Unavailable Shopify resource";
  const unresolved = !node.attrs.title;

  return (
    <NodeViewWrapper
      className="bre-shopify-resource"
      data-resource-status={unresolved ? "unresolved" : "resolved"}
      data-resource-type={node.attrs.resourceType}
    >
      <span className="bre-shopify-resource__type">{node.attrs.resourceType}</span>
      <span className="bre-shopify-resource__title">{title}</span>
      {unresolved ? <span className="bre-shopify-resource__id">{node.attrs.id}</span> : null}
    </NodeViewWrapper>
  );
}
