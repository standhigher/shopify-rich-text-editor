import { describe, expect, it } from "vitest";

import {
  ExtensionRegistryError,
  MigrationError,
  migrateDocument,
  resolveExtensions,
  type Migration,
  type RichTextDocument,
  type RichTextExtension
} from "../src";

const extension = (id: string, dependencies: string[] = [], nodes: string[] = []): RichTextExtension => ({
  id,
  version: "1.0.0",
  dependencies,
  nodes,
  client: { extensions: [`client:${id}`] },
  server: { extensions: [`server:${id}`] }
});

describe("extension contracts", () => {
  it("resolves dependencies in a deterministic order", () => {
    const resolved = resolveExtensions([
      extension("feature", ["base"]),
      extension("base"),
      extension("independent")
    ]);

    expect(resolved.map(({ id }) => id)).toEqual(["base", "feature", "independent"]);
  });

  it("rejects missing dependencies, cycles, duplicate ids and name conflicts", () => {
    expect(() => resolveExtensions([extension("feature", ["missing"])]))
      .toThrowError(expect.objectContaining({ code: "MISSING_EXTENSION_DEPENDENCY" }));
    expect(() => resolveExtensions([extension("a", ["b"]), extension("b", ["a"])]))
      .toThrowError(expect.objectContaining({ code: "EXTENSION_DEPENDENCY_CYCLE" }));
    expect(() => resolveExtensions([extension("same"), extension("same")]))
      .toThrowError(expect.objectContaining({ code: "DUPLICATE_EXTENSION_ID" }));
    expect(() => resolveExtensions([extension("a", [], ["callout"]), extension("b", [], ["callout"])]))
      .toThrowError(expect.objectContaining({ code: "NODE_NAME_CONFLICT" }));
  });

  it("exposes stable structured extension errors", () => {
    expect(() => resolveExtensions([extension("feature", ["missing"])] )).toThrowError(ExtensionRegistryError);
  });
});

describe("migration contracts", () => {
  const document: RichTextDocument = {
    version: 1,
    schemaVersion: "1",
    content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "before" }] }] }
  };

  it("applies a migration path without mutating the input", () => {
    const migrations: Migration[] = [
      { from: "1", to: "2", migrate: (value) => ({ ...value, schemaVersion: "2" }) },
      { from: "2", to: "3", migrate: (value) => ({ ...value, schemaVersion: "3" }) }
    ];

    const migrated = migrateDocument(document, "3", migrations);

    expect(migrated.schemaVersion).toBe("3");
    expect(document.schemaVersion).toBe("1");
  });

  it("rejects missing, duplicate and cyclic migration paths", () => {
    expect(() => migrateDocument(document, "3", [])).toThrowError(
      expect.objectContaining({ code: "MISSING_MIGRATION" })
    );
    expect(() => migrateDocument(document, "2", [
      { from: "1", to: "2", migrate: (value) => value },
      { from: "1", to: "2", migrate: (value) => value }
    ])).toThrowError(expect.objectContaining({ code: "DUPLICATE_MIGRATION" }));
    expect(() => migrateDocument(document, "3", [
      { from: "1", to: "2", migrate: (value) => value },
      { from: "2", to: "1", migrate: (value) => value }
    ])).toThrowError(expect.objectContaining({ code: "MIGRATION_CYCLE" }));
  });

  it("does not expose implementation errors as unstructured failures", () => {
    expect(() => migrateDocument(document, "3", [])).toThrowError(MigrationError);
  });
});
