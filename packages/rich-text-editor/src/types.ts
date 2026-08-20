import type { JSONContent } from "@tiptap/core";

import type { RichTextError } from "./errors";

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
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}
