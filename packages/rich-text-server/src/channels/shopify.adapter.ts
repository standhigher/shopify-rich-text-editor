import type { RichTextDocument } from "../types";
import { richTextJsonToHtml } from "../serializers";
import { sanitizeRichTextHtml } from "../security/sanitize-html";
import { validateRichTextDocument } from "../validation";

export function renderShopifyHtml(document: RichTextDocument): string {
  const validDocument = validateRichTextDocument(document);
  const html = richTextJsonToHtml(validDocument.content);

  return sanitizeRichTextHtml(html);
}

