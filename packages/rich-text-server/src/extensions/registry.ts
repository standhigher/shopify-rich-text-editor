import type { AnyExtension } from "@tiptap/core";
import {
  createExtensionRegistry,
  type RichTextExtension,
  type RichTextNode,
  type ResolvedExtensionRegistry
} from "@standhigher/shopify-rich-text-core";

import { serverExtensions } from "../extensions";

export type ServerExtension = RichTextExtension<never, AnyExtension>;
export type ServerExtensionRegistry = ResolvedExtensionRegistry<never, AnyExtension>;

export const baseServerExtension: ServerExtension = {
  id: "base",
  version: "1.0.0",
  nodes: [
    "doc", "paragraph", "text", "heading", "blockquote", "bulletList", "orderedList",
    "listItem", "codeBlock", "horizontalRule", "hardBreak", "image", "shopifyResource"
  ],
  marks: ["bold", "code", "italic", "strike", "underline", "link"],
  server: {
    extensions: serverExtensions,
    plainTextSerializers: {
      shopifyResource: (node: RichTextNode) =>
        typeof node.attrs?.title === "string" && node.attrs.title.trim().length > 0
          ? node.attrs.title
          : "Unavailable Shopify resource"
    }
  }
};

export function createServerExtensionRegistry(
  extensionContracts: readonly ServerExtension[] = []
): ServerExtensionRegistry {
  return createExtensionRegistry([baseServerExtension, ...extensionContracts]);
}
