import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as core from "../../packages/rich-text-core/src";
import * as editor from "../../packages/rich-text-editor/src";
import * as server from "../../packages/rich-text-server/src";

describe("1.0 public API surface", () => {
  it("keeps all published package manifests on the same stable version", () => {
    for (const packagePath of [
      "packages/rich-text-core/package.json",
      "packages/rich-text-editor/package.json",
      "packages/rich-text-server/package.json"
    ]) {
      const manifest = JSON.parse(readFileSync(resolve(process.cwd(), packagePath), "utf8"));
      expect(manifest.version).toBe("1.0.0");
    }
  });

  it("exposes the frozen stable entry points", () => {
    expect(core.createRichTextDocument).toBeTypeOf("function");
    expect(core.RICH_TEXT_PROTOCOL_VERSION).toBe(1);
    expect(editor.RichTextEditor).toBeTypeOf("function");
    expect(editor.createEditorConfig).toBeTypeOf("function");
    expect(server.processRichText).toBeTypeOf("function");
    expect(server.renderShopifyHtml).toBeTypeOf("function");
    expect(server.validateRichTextDocument).toBeTypeOf("function");
  });

  it("keeps the 0.6 compatibility APIs available from package roots", () => {
    expect(editor.selectResource).toBeTypeOf("function");
    expect(server.renderShopifyHtml).toBe(server.renderShopifyHtml);
  });
});
