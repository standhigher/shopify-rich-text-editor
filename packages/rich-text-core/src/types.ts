export const RICH_TEXT_PROTOCOL_VERSION = 1 as const;

export type RichTextNodeAttrs = Record<string, unknown>;

export interface RichTextMark {
  type: string;
  attrs?: RichTextNodeAttrs;
}

export interface RichTextNode {
  type: string;
  attrs?: RichTextNodeAttrs;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
}

export interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: RichTextNode;
  plainText?: string;
}

export interface EditorChangeContext {
  source: "initial" | "user" | "external";
  dirty: boolean;
  transactionId?: number;
}

export interface RichTextWarning {
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}
