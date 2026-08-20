import type { JSONContent } from "@tiptap/core";
import type { UseEditorOptions } from "@tiptap/react";

import { createEditorExtensionRegistry } from "./extensions/registry";
import type { EditorExtension } from "./extensions/registry";

export type { EditorExtension } from "./extensions/registry";
export { createEditorExtensionRegistry } from "./extensions/registry";

export interface CreateEditorConfigOptions {
  content: JSONContent;
  extensionContracts?: readonly EditorExtension[];
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onUpdate?: UseEditorOptions["onUpdate"];
}

export function createEditorConfig({
  content,
  extensionContracts = [],
  readOnly = false,
  disabled = false,
  placeholder,
  onUpdate
}: CreateEditorConfigOptions): UseEditorOptions {
  const registry = createEditorExtensionRegistry(extensionContracts);

  return {
    extensions: [...registry.clientExtensions],
    content,
    editable: !readOnly && !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": placeholder ?? "Rich text editor",
        class: "bre-prosemirror"
      }
    },
    onUpdate
  };
}
