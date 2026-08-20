import type { JSONContent } from "@tiptap/core";
import type { UseEditorOptions } from "@tiptap/react";

import { createEditorExtensionRegistry } from "./extensions/registry";
import type { EditorExtension } from "./extensions/registry";
import { createResourceProviderExtension } from "./providers/resource";
import type { ResourceProvider } from "@standhigher/shopify-rich-text-core";

export type { EditorExtension } from "./extensions/registry";
export { createEditorExtensionRegistry } from "./extensions/registry";

export interface CreateEditorConfigOptions {
  content: JSONContent;
  extensionContracts?: readonly EditorExtension[];
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  resourceProvider?: ResourceProvider;
  onUpdate?: UseEditorOptions["onUpdate"];
}

export function createEditorConfig({
  content,
  extensionContracts = [],
  readOnly = false,
  disabled = false,
  placeholder,
  resourceProvider,
  onUpdate
}: CreateEditorConfigOptions): UseEditorOptions {
  const registry = createEditorExtensionRegistry(extensionContracts);
  const resourceProviderExtensions = resourceProvider
    ? [createResourceProviderExtension(resourceProvider)]
    : [];

  return {
    extensions: [...registry.clientExtensions, ...resourceProviderExtensions],
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
