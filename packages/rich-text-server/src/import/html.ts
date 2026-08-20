import type { JSONContent } from "@tiptap/core";
import { generateJSON } from "@tiptap/html";
import {
  CURRENT_RICH_TEXT_SCHEMA_VERSION,
  type RichTextWarning
} from "@standhigher/shopify-rich-text-core";

import { serverExtensions } from "../extensions";
import type { RichTextDocument } from "../types";
import { validateCurrentRichTextDocument } from "../validation";
import { normalizeStandardHtml } from "./normalize";

export type HtmlImportErrorCode = "EMPTY_IMPORT" | "INVALID_IMPORT";

export interface HtmlImportError {
  code: HtmlImportErrorCode;
  message: string;
}

export interface HtmlImportSuccess {
  ok: true;
  document: RichTextDocument;
  warnings: RichTextWarning[];
}

export interface HtmlImportFailure {
  ok: false;
  error: HtmlImportError;
  warnings: RichTextWarning[];
}

export type HtmlImportResult = HtmlImportSuccess | HtmlImportFailure;

export function importStandardHtml(html: string): HtmlImportResult {
  const normalized = normalizeStandardHtml(html);

  if (!normalized.html) {
    return {
      ok: false,
      error: {
        code: "EMPTY_IMPORT",
        message: "HTML import did not contain supported rich text content."
      },
      warnings: normalized.warnings
    };
  }

  try {
    const content = pruneEmptyNodes(generateJSON(normalized.html, [...serverExtensions]));
    const document = validateCurrentRichTextDocument({
      version: 1,
      schemaVersion: CURRENT_RICH_TEXT_SCHEMA_VERSION,
      content
    });

    if (!document.content.content?.length) {
      return {
        ok: false,
        error: {
          code: "EMPTY_IMPORT",
          message: "HTML import did not contain supported rich text content."
        },
        warnings: normalized.warnings
      };
    }

    return { ok: true, document, warnings: normalized.warnings };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "INVALID_IMPORT",
        message: error instanceof Error ? error.message : "HTML import failed."
      },
      warnings: normalized.warnings
    };
  }
}

function pruneEmptyNodes(node: JSONContent): JSONContent {
  const content = node.content?.map(pruneEmptyNodes).filter((child) => !isEmptyBlock(child));
  const next: JSONContent = { ...node };
  if (content) next.content = content;
  return next;
}

function isEmptyBlock(node: JSONContent): boolean {
  return (
    (node.type === "paragraph" || node.type === "heading" || node.type === "blockquote") &&
    !node.content?.some((child) => child.type !== "text" || (child.text?.trim().length ?? 0) > 0)
  );
}
