import type { JSONContent } from "@tiptap/core";

export interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: JSONContent;
  plainText?: string;
}

