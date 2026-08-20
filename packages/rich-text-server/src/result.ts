import type { RichTextWarning } from "@standhigher/shopify-rich-text-core";

export type RichTextChannel = "shopify-html";

export type ProcessRichTextErrorCode =
  | "INVALID_DOCUMENT"
  | "MIGRATION_FAILED"
  | "UNKNOWN_NODE"
  | "UNKNOWN_MARK"
  | "INVALID_RESOURCE"
  | "UNSAFE_URL"
  | "DOCUMENT_TOO_LARGE"
  | "DOCUMENT_TOO_DEEP"
  | "PROCESSING_FAILED";

export interface ProcessRichTextError {
  code: ProcessRichTextErrorCode;
  message: string;
  path?: string;
}

export interface ProcessRichTextSuccess {
  ok: true;
  html: string;
  plainText: string;
  warnings: RichTextWarning[];
  schemaVersion: string;
  channel: RichTextChannel;
}

export interface ProcessRichTextFailure {
  ok: false;
  error: ProcessRichTextError;
  warnings: RichTextWarning[];
  schemaVersion?: string;
  channel: RichTextChannel;
}

export type ProcessResult = ProcessRichTextSuccess | ProcessRichTextFailure;
