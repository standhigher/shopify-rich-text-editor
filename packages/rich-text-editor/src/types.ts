import type { JSONContent } from "@tiptap/core";

import type { RichTextError } from "./errors";
import type { EditorExtension } from "./create-editor";
import type { ResourceProvider } from "@standhigher/shopify-rich-text-core";

export interface ShopifyImageUploadResult {
  src: string;
  alt?: string;
  title?: string;
  shopifyFileId?: string;
}

export interface RichTextEditorProps {
  value: JSONContent;
  onChange?: (content: JSONContent) => void;
  onError?: (error: RichTextError) => void;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  extensionContracts?: readonly EditorExtension[];
  resourceProvider?: ResourceProvider;
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}
