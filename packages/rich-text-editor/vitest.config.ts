import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@standhigher/shopify-rich-text-core": new URL("../rich-text-core/src/index.ts", import.meta.url).pathname
    }
  },
  esbuild: {
    jsxInject: `import React from "react"`
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"]
  }
});
