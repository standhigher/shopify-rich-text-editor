import type { AnyExtension } from "@tiptap/core";
import {
  createExtensionRegistry,
  type RichTextExtension,
  type ResolvedExtensionRegistry
} from "@standhigher/shopify-rich-text-core";

import { baseExtensions } from "./base";

export type EditorExtension = RichTextExtension<AnyExtension, never>;
export type EditorExtensionRegistry = ResolvedExtensionRegistry<AnyExtension, never>;

export const baseEditorExtension: EditorExtension = {
  id: "base",
  version: "1.0.0",
  nodes: [
    "doc", "paragraph", "text", "heading", "blockquote", "bulletList", "orderedList",
    "listItem", "codeBlock", "horizontalRule", "hardBreak", "image"
  ],
  marks: ["bold", "code", "italic", "strike", "underline", "link"],
  client: { extensions: baseExtensions }
};

export function createEditorExtensionRegistry(
  extensionContracts: readonly EditorExtension[] = []
): EditorExtensionRegistry {
  return createExtensionRegistry([baseEditorExtension, ...extensionContracts]);
}
