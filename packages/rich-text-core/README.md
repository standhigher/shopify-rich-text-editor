# @standhigher/shopify-rich-text-core

Dependency-free contracts shared by the editor and server packages.

The Core package contains the persisted `RichTextDocument` shape, structured errors and warnings, extension registration rules, and pure schema migration helpers. It does not import React, Polaris, Next.js, Tiptap, Shopify SDKs, or HTML sanitizers.

```bash
pnpm add @standhigher/shopify-rich-text-core
```

Use the package root as the only public entry point:

```ts
import {
  RICH_TEXT_PROTOCOL_VERSION,
  migrateDocument,
  resolveExtensions,
  type RichTextDocument,
  type RichTextExtension
} from "@standhigher/shopify-rich-text-core";
```

Extension IDs must be unique. Dependencies are resolved before dependents, and duplicate node or mark names are rejected. Migrations are pure from the caller's perspective: the input document is cloned before each migration and is never mutated by the helper.
