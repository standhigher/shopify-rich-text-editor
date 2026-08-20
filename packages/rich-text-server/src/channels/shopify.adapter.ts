import type { RichTextDocument } from "../types";
import type { ShopifyResourceRenderOptions } from "./resource-renderer";
import { richTextJsonToHtml } from "../serializers";
import { sanitizeRichTextHtml } from "../security/sanitize-html";
import { prepareRichTextDocument } from "../validation";

export function renderShopifyHtml(document: RichTextDocument, options: ShopifyResourceRenderOptions = {}): string {
  const validDocument = prepareRichTextDocument(document);
  return renderShopifyHtmlContent(validDocument, options);
}

export function renderShopifyHtmlContent(
  document: RichTextDocument,
  options: ShopifyResourceRenderOptions = {}
): string {
  const html = richTextJsonToHtml(document.content, [], options);

  return sanitizeRichTextHtml(html);
}
