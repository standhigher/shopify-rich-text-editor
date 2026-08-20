import { describe, expect, it } from "vitest";
import { Extension } from "@tiptap/core";

import {
  createEditorConfig,
  createEditorExtensionRegistry,
  type EditorExtension
} from "../src/create-editor";

const customExtension = (): EditorExtension => ({
  id: "callout",
  version: "1.0.0",
  nodes: ["callout"],
  client: { extensions: [Extension.create({ name: "callout" })] }
});

describe("editor extension registry", () => {
  it("keeps the base editor extensions as the default registration", () => {
    const registry = createEditorExtensionRegistry();

    expect(registry.nodeNames.has("paragraph")).toBe(true);
    expect(registry.markNames.has("bold")).toBe(true);
    expect(registry.clientExtensions.length).toBeGreaterThan(0);
  });

  it("registers a custom client extension after its dependencies", () => {
    const registry = createEditorExtensionRegistry([customExtension()]);

    expect(registry.nodeNames.has("callout")).toBe(true);
    expect(registry.clientExtensions.some((extension) => extension.name === "callout")).toBe(true);
  });

  it("returns a Tiptap config using resolved extensions", () => {
    const config = createEditorConfig({
      content: { type: "doc", content: [] },
      extensionContracts: [customExtension()]
    });

    expect(config.immediatelyRender).toBe(false);
    expect(config.extensions?.some((extension) => extension.name === "callout")).toBe(true);
  });

  it("rejects conflicting custom node names during initialization", () => {
    expect(() => createEditorExtensionRegistry([
      customExtension(),
      { ...customExtension(), id: "other-callout" }
    ])).toThrowError(expect.objectContaining({ code: "NODE_NAME_CONFLICT" }));
  });
});
