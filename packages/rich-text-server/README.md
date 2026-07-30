# @standhigher/shopify-rich-text-server

Server-side helpers for validating Shopify Rich Text Editor JSON, rendering HTML, sanitizing HTML, and producing Shopify-safe output.

## Install

```bash
pnpm add @standhigher/shopify-rich-text-server
```

Use it in your Shopify App backend or server route:

```ts
import {
  parseRichTextDocument,
  renderShopifyHtml,
} from "@standhigher/shopify-rich-text-server";

export async function renderDescription(input: unknown) {
  const document = parseRichTextDocument(input);

  return renderShopifyHtml(document);
}
```

## Notes

- Validate untrusted JSON before rendering.
- Store editor JSON as the editable source of truth.
- Render and sanitize HTML on the server before writing to Shopify.
