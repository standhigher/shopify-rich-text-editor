import type { RichTextDocument } from "../types";
import type { ShopifyResourceRenderOptions } from "./resource-renderer";
import { richTextJsonToHtml } from "../serializers";
import { sanitizeRichTextHtml } from "../security/sanitize-html";
import { validateRichTextDocument } from "../validation";

export function renderShopifyHtml(document: RichTextDocument, options: ShopifyResourceRenderOptions = {}): string {
  const validDocument = validateRichTextDocument(document);
  const html = richTextJsonToHtml(validDocument.content, [], options);

  return sanitizeRichTextHtml(html);
}
