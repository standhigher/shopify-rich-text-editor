import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

import {
  RICH_TEXT_PROTOCOL_VERSION,
  runRichTextMigrations,
  type RichTextDocument as CoreRichTextDocument
} from "@standhigher/shopify-rich-text-core";
import type { RichTextDocument, RichTextValidationLimits } from "./types";
import type { ResourceType } from "@standhigher/shopify-rich-text-core";
import { RichTextValidationError } from "./errors";
import { RICH_TEXT_VALIDATION_LIMITS } from "./types";
import { createServerExtensionRegistry, type ServerExtensionRegistry } from "./extensions/registry";

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
  limits: Partial<RichTextValidationLimits> = {},
  registry: ServerExtensionRegistry = createServerExtensionRegistry()
): RichTextDocument {
  return prepareRichTextDocument(value, limits, registry);
}

export function prepareRichTextDocument(
  value: unknown,
  limits: Partial<RichTextValidationLimits> = {},
  registry: ServerExtensionRegistry = createServerExtensionRegistry()
): RichTextDocument {
  const envelope = parseRichTextDocumentEnvelope(value);

  if (envelope.version > RICH_TEXT_PROTOCOL_VERSION) {
    throw new RichTextValidationError(
      "INVALID_DOCUMENT",
      `Unsupported rich text protocol version: ${envelope.version}`,
      "version"
    );
  }

  const migration = runRichTextMigrations(envelope as CoreRichTextDocument);

  if (!migration.ok) {
    throw new RichTextValidationError("MIGRATION_FAILED", migration.message);
  }

  return validateCurrentRichTextDocument(migration.document, limits, registry);
}

export function validateCurrentRichTextDocument(
  value: unknown,
  limits: Partial<RichTextValidationLimits> = {},
  registry: ServerExtensionRegistry = createServerExtensionRegistry()
): RichTextDocument {
  const result = richTextDocumentSchema.safeParse(value);

  if (!result.success) {
    throw new RichTextValidationError("INVALID_DOCUMENT", `Invalid rich text document: ${result.error.message}`);
  }

  validateRichTextDocumentContent(result.data, limits, registry);

  return result.data;
}

function parseRichTextDocumentEnvelope(value: unknown): RichTextDocument {
  const result = richTextDocumentSchema.safeParse(value);

  if (!result.success) {
    throw new RichTextValidationError("INVALID_DOCUMENT", `Invalid rich text document: ${result.error.message}`);
  }

  return result.data;
}

function validateRichTextDocumentContent(
  document: RichTextDocument,
  limits: Partial<RichTextValidationLimits>,
  registry: ServerExtensionRegistry
): void {
  const validationLimits = { ...RICH_TEXT_VALIDATION_LIMITS, ...limits };
  const serializedDocument = JSON.stringify(document);
  const documentBytes = new TextEncoder().encode(serializedDocument).length;

  if (documentBytes > validationLimits.maxDocumentBytes) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document exceeds ${validationLimits.maxDocumentBytes} bytes`
    );
  }

  const stats = { textLength: 0, nodeCount: 0, attrsCount: 0 };
  validateNode(document.content, 0, "content", stats, validationLimits, registry);

  if (stats.textLength > validationLimits.maxTextLength) {
    throw new RichTextValidationError(
      "DOCUMENT_TOO_LARGE",
      `Document text exceeds ${validationLimits.maxTextLength} characters`
    );
  }
}

function validateNode(
  node: JSONContent,
  depth: number,
  path: string,
  stats: { textLength: number; nodeCount: number; attrsCount: number },
  limits: RichTextValidationLimits,
  registry: ServerExtensionRegistry
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

  if (!node.type || !registry.nodeNames.has(node.type)) {
    throw new RichTextValidationError("UNKNOWN_NODE", `Unknown node type: ${node.type ?? "<missing>"}`, path);
  }

  if (node.type === "text") {
    stats.textLength += node.text?.length ?? 0;
  }

  if (node.type === "image") {
    validateUrl(node.attrs?.src, path, "Image source", true);
  }

  if (node.type === "shopifyResource") {
    validateShopifyResource(node.attrs, path);
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

    if (!registry.markNames.has(mark.type)) {
      throw new RichTextValidationError("UNKNOWN_MARK", `Unknown mark type: ${mark.type}`, `${path}.marks[${index}]`);
    }

    if (mark.type === "link") {
      validateUrl(mark.attrs?.href, `${path}.marks[${index}]`, "Link", false);
    }
  });

  node.content?.forEach((child, index) => {
    validateNode(child, depth + 1, `${path}.content[${index}]`, stats, limits, registry);
  });
}

function validateShopifyResource(attrs: JSONContent["attrs"], path: string): void {
  const resourceAttrs = attrs ?? {};
  const allowedKeys = new Set(["resourceType", "id", "title", "handle", "image"]);
  const unexpectedKey = Object.keys(resourceAttrs).find((key) => !allowedKeys.has(key));
  if (unexpectedKey) {
    throw new RichTextValidationError(
      "INVALID_RESOURCE",
      `Shopify resource contains unsupported attribute: ${unexpectedKey}`,
      `${path}.attrs.${unexpectedKey}`
    );
  }

  const resourceType = resourceAttrs.resourceType;
  const id = resourceAttrs.id;
  const patterns: Record<ResourceType, RegExp> = {
    product: /^gid:\/\/shopify\/Product\/\d+$/,
    collection: /^gid:\/\/shopify\/Collection\/\d+$/,
    variant: /^gid:\/\/shopify\/ProductVariant\/\d+$/
  };

  if (typeof resourceType !== "string" || !(resourceType in patterns)) {
    throw new RichTextValidationError(
      "INVALID_RESOURCE",
      "Shopify resource type must be product, collection, or variant",
      `${path}.attrs.resourceType`
    );
  }

  if (typeof id !== "string" || !patterns[resourceType as ResourceType].test(id)) {
    throw new RichTextValidationError(
      "INVALID_RESOURCE",
      `Shopify ${resourceType} resource id must be a valid Shopify GID`,
      `${path}.attrs.id`
    );
  }

  for (const key of ["title", "handle"] as const) {
    if (resourceAttrs[key] !== undefined && typeof resourceAttrs[key] !== "string") {
      throw new RichTextValidationError(
        "INVALID_RESOURCE",
        `Shopify resource ${key} must be a string when provided`,
        `${path}.attrs.${key}`
      );
    }
  }

  if (resourceAttrs.image !== undefined) {
    validateUrl(resourceAttrs.image, path, "Resource image", true);
  }
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
