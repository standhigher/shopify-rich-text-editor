import type { JSONContent } from "@tiptap/core";

export interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: JSONContent;
  plainText?: string;
}

export interface RichTextValidationLimits {
  maxTextLength: number;
  maxDocumentBytes: number;
  maxDepth: number;
  maxNodeCount: number;
  maxAttrsCount: number;
}

export const RICH_TEXT_VALIDATION_LIMITS = {
  maxTextLength: 100_000,
  maxDocumentBytes: 1_048_576,
  maxDepth: 64,
  maxNodeCount: 10_000,
  maxAttrsCount: 10_000
} as const satisfies Readonly<RichTextValidationLimits>;
