import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const workspaceRoot = process.cwd();
const tempRoot = mkdtempSync(join(tmpdir(), "best-rich-text-consumer-"));
const nodeModulesDir = join(tempRoot, "node_modules");
const scopeDir = join(nodeModulesDir, "@standhigher");

const packages = {
  "shopify-rich-text-core": "packages/rich-text-core",
  "shopify-rich-text-editor": "packages/rich-text-editor",
  "shopify-rich-text-server": "packages/rich-text-server"
};

mkdirSync(scopeDir, { recursive: true });

try {
  for (const [packageName, packagePath] of Object.entries(packages)) {
    symlinkSync(resolve(workspaceRoot, packagePath), join(scopeDir, packageName), "dir");
  }

  const consumerPath = join(tempRoot, "consumer.mjs");
  writeFileSync(
    consumerPath,
    `
      import * as core from "@standhigher/shopify-rich-text-core";
      import * as coreExperimental from "@standhigher/shopify-rich-text-core/experimental";
      import * as editor from "@standhigher/shopify-rich-text-editor";
      import * as editorExperimental from "@standhigher/shopify-rich-text-editor/experimental";
      import * as server from "@standhigher/shopify-rich-text-server";
      import { createRequire } from "node:module";
      import { readFileSync } from "node:fs";

      const require = createRequire(import.meta.url);
      const cssPath = require.resolve("@standhigher/shopify-rich-text-editor/styles.css");
      const css = readFileSync(cssPath, "utf8");

      if (core.RICH_TEXT_PROTOCOL_VERSION !== 1) throw new Error("core root import failed");
      if (typeof coreExperimental.ResourceProviderError !== "function") throw new Error("core experimental import failed");
      if (typeof editor.RichTextEditor !== "function") throw new Error("editor root import failed");
      if (typeof editorExperimental.selectResource !== "function") throw new Error("editor experimental import failed");
      if (typeof server.renderShopifyHtml !== "function") throw new Error("server root import failed");
      if (!css.includes(".bre-root")) throw new Error("editor CSS export failed");
    `
  );

  await import(pathToFileURL(consumerPath).href);
  console.log("Clean consumer imports passed");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
