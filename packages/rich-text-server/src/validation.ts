import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

import type { RichTextDocument, RichTextValidationLimits } from "./types";
import { RichTextValidationError } from "./errors";
import { RICH_TEXT_VALIDATION_LIMITS } from "./types";

const allowedNodes = new Set([
  "doc", "paragraph", "text", "heading", "blockquote", "bulletList",
  "orderedList", "listItem", "codeBlock", "horizontalRule", "hardBreak", "image"
]);

const allowedMarks = new Set(["bold", "code", "italic", "strike", "underline", "link"]);

const jsonContentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.string().optional(),
      attrs: z.record(z.unknown()).optional(),
      content: z.array(jsonContentSchema).optional(),
      marks: z
        .array(
          z.object({
            type: z.string(),
            attrs: z.record(z.unknown()).optional()
          })
        )
        .optional(),
      text: z.string().optional()
    })
    .passthrough()
);

const richTextDocumentSchema = z.object({
  version: z.number().int().positive(),
  schemaVersion: z.string().min(1),
  content: jsonContentSchema.refine((content) => content.type === "doc", {
    message: "content must be a Tiptap doc"
  }),
  plainText: z.string().optional()
});

export function validateRichTextDocument(
  value: unknown,
  limits: Partial<RichTextValidationLimits> = {}
): RichTextDocument {
  const result = richTextDocumentSchema.safeParse(value);

  if (!result.success) {
    throw new RichTextValidationError("INVALID_DOCUMENT", `Invalid rich text document: ${result.error.message}`);
  }

  const validationLimits = { ...RICH_TEXT_VALIDATION_LIMITS, ...limits };
  const serializedDocument = JSON.stringify(result.data);
  const documentBytes = new TextEncoder().encode(serializedDocument).length;

  if (documentBytes > validationLimits.maxDocumentBytes) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document exceeds ${validationLimits.maxDocumentBytes} bytes`
    );
  }

  const stats = { textLength: 0, nodeCount: 0, attrsCount: 0 };
  validateNode(result.data.content, 0, "content", stats, validationLimits);

  if (stats.textLength > validationLimits.maxTextLength) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document text exceeds ${validationLimits.maxTextLength} characters`
    );
  }

  return result.data;
}

function validateNode(
  node: JSONContent,
  depth: number,
  path: string,
  stats: { textLength: number; nodeCount: number; attrsCount: number },
  limits: RichTextValidationLimits
): void {
  stats.nodeCount += 1;
  if (stats.nodeCount > limits.maxNodeCount) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document node count exceeds ${limits.maxNodeCount}`,
      path
    );
  }

  stats.attrsCount += Object.keys(node.attrs ?? {}).length;
  if (stats.attrsCount > limits.maxAttrsCount) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document attrs count exceeds ${limits.maxAttrsCount}`,
      `${path}.attrs`
    );
  }

  if (depth > limits.maxDepth) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_DEEP",
      `Document nesting exceeds depth ${limits.maxDepth}`,
      path
    );
  }

  if (!node.type || !allowedNodes.has(node.type)) {
    throw new RichTextValidationError("UNKNOWN_NODE", `Unknown node type: ${node.type ?? "<missing>"}`, path);
  }

  if (node.type === "text") {
    stats.textLength += node.text?.length ?? 0;
  }

  if (node.type === "image") {
    validateUrl(node.attrs?.src, path, "Image source", true);
  }

  node.marks?.forEach((mark, index) => {
    stats.attrsCount += Object.keys(mark.attrs ?? {}).length;
    if (stats.attrsCount > limits.maxAttrsCount) {
      throw new RichTextValidationError(
        "DOCUMENT_TOO_LARGE",
        `Document attrs count exceeds ${limits.maxAttrsCount}`,
        `${path}.marks[${index}].attrs`
      );
    }

    if (!allowedMarks.has(mark.type)) {
      throw new RichTextValidationError("UNKNOWN_MARK", `Unknown mark type: ${mark.type}`, `${path}.marks[${index}]`);
    }

    if (mark.type === "link") {
      validateUrl(mark.attrs?.href, `${path}.marks[${index}]`, "Link", false);
    }
  });

  node.content?.forEach((child, index) => {
    validateNode(child, depth + 1, `${path}.content[${index}]`, stats, limits);
  });
}

function validateUrl(value: unknown, path: string, label: string, image: boolean): void {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RichTextValidationError("UNSAFE_URL", `${label} must be a non-empty URL`, `${path}.attrs`);
  }

  const normalized = value.trim().toLowerCase();
  if (/^(javascript|vbscript|data):/.test(normalized) || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new RichTextValidationError("UNSAFE_URL", `${label} uses a forbidden URL scheme`, `${path}.attrs`);
  }

  const allowedScheme = image ? /^(https?):/ : /^(https?|mailto|tel):/;
  if (!allowedScheme.test(normalized)) {
    throw new RichTextValidationError(
      "UNSAFE_URL",
      image ? "Image source must use http or https" : "Link must use http, https, mailto, or tel",
      `${path}.attrs`
    );
  }
}
