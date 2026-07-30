# @standhigher/shopify-rich-text-editor

Shopify App rich text editor component built with React, Tiptap 3, Polaris React, and Lucide icons.

## Install

```bash
pnpm add @standhigher/shopify-rich-text-editor @shopify/polaris react react-dom
```

Import the component and styles in your Shopify App frontend:

```tsx
import {
  RichTextEditor,
  type RichTextDocument,
} from "@standhigher/shopify-rich-text-editor";
import "@standhigher/shopify-rich-text-editor/styles.css";

export function ProductDescriptionEditor() {
  const [value, setValue] = useState<RichTextDocument | null>(null);

  return (
    <RichTextEditor
      value={value}
      onChange={setValue}
      placeholder="Write product content..."
    />
  );
}
```

## Notes

- Wrap your app with Shopify Polaris providers before rendering the editor.
- Persist the editor JSON document as the source of truth.
- Use `@standhigher/shopify-rich-text-server` on the server when HTML output or sanitization is needed.
