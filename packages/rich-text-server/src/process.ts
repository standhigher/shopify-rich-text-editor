import type { RichTextWarning } from "@standhigher/shopify-rich-text-core";

import type { ShopifyResourceRenderOptions } from "./channels/resource-renderer";
import { renderShopifyHtmlContent } from "./channels/shopify.adapter";
import { RichTextValidationError } from "./errors";
import { richTextJsonToPlainText } from "./serializers";
import type { ProcessResult, ProcessRichTextError, RichTextChannel } from "./result";
import type { RichTextDocument } from "./types";
import { prepareRichTextDocument } from "./validation";

export interface ProcessRichTextOptions extends ShopifyResourceRenderOptions {
  channel?: RichTextChannel;
}

export function processRichText(value: unknown, options: ProcessRichTextOptions = {}): ProcessResult {
  const channel = options.channel ?? "shopify-html";
  const warnings: RichTextWarning[] = [];

  try {
    const document = prepareRichTextDocument(value);
    warnings.push(...collectShopifyHtmlWarnings(document));

    const html = renderShopifyHtmlContent(document, options);
    return {
      ok: true,
      html,
      plainText: richTextJsonToPlainText(document.content),
      warnings,
      schemaVersion: document.schemaVersion,
      channel
    };
  } catch (error) {
    return {
      ok: false,
      error: normalizeProcessError(error),
      warnings,
      channel
    };
  }
}

function normalizeProcessError(error: unknown): ProcessRichTextError {
  if (error instanceof RichTextValidationError) {
    return {
      code: error.code,
      message: error.message,
      path: error.path
    };
  }

  return {
    code: "PROCESSING_FAILED",
    message: error instanceof Error ? error.message : "Rich text processing failed."
  };
}

function collectShopifyHtmlWarnings(document: RichTextDocument): RichTextWarning[] {
  const warnings: RichTextWarning[] = [];
  walk(document.content, "content", (node, path) => {
    if (node.type === "codeBlock" || node.type === "horizontalRule") {
      warnings.push({
        code: "CHANNEL_NODE_DEGRADED",
        message: `Node ${node.type} is degraded by the shopify-html channel.`,
        path,
        details: { channel: "shopify-html", nodeType: node.type }
      });
    }
  });
  return warnings;
}

function walk(
  node: RichTextDocument["content"],
  path: string,
  visit: (node: RichTextDocument["content"], path: string) => void
): void {
  visit(node, path);
  node.content?.forEach((child, index) => walk(child, `${path}.content[${index}]`, visit));
}
