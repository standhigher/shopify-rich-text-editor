import type { JSONContent } from "@tiptap/core";

export interface ShopifyImageUploadResult {
  src: string;
  alt?: string;
  title?: string;
  shopifyFileId?: string;
}

export interface RichTextEditorProps {
  value: JSONContent;
  onChange?: (content: JSONContent) => void;
  readOnly?: boolean;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}

