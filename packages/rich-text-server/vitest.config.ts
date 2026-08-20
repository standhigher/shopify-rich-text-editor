import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@standhigher/shopify-rich-text-core": new URL("../rich-text-core/src/index.ts", import.meta.url).pathname
    }
  }
});
