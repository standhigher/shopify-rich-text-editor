import type { AnyExtension } from "@tiptap/core";
import {
  createExtensionRegistry,
  type RichTextExtension,
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
    "listItem", "codeBlock", "horizontalRule", "hardBreak", "image"
  ],
  marks: ["bold", "code", "italic", "strike", "underline", "link"],
  server: { extensions: serverExtensions }
};

export function createServerExtensionRegistry(
  extensionContracts: readonly ServerExtension[] = []
): ServerExtensionRegistry {
  return createExtensionRegistry([baseServerExtension, ...extensionContracts]);
}
