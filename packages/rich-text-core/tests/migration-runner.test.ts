import { describe, expect, it } from "vitest";

import {
  CURRENT_RICH_TEXT_SCHEMA_VERSION,
  runRichTextMigrations,
  type Migration,
  type RichTextDocument
} from "../src";

const document: RichTextDocument = {
  version: 1,
  schemaVersion: "2026-07",
  content: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "hello" }] }]
  }
};

describe("migration runner", () => {
  it("migrates to the current schema version without mutating the input", () => {
    const result = runRichTextMigrations(document);

    expect(result).toMatchObject({
      ok: true,
      schemaVersion: CURRENT_RICH_TEXT_SCHEMA_VERSION,
      migrationsApplied: ["2026-07->2026-08"]
    });
    expect(result.document.schemaVersion).toBe(CURRENT_RICH_TEXT_SCHEMA_VERSION);
    expect(document.schemaVersion).toBe("2026-07");
  });

  it("is idempotent for the same target schema version", () => {
    const first = runRichTextMigrations(document);
    expect(first.ok).toBe(true);

    const second = runRichTextMigrations(first.document);

    expect(second.ok).toBe(true);
    expect(second.document).toEqual(first.document);
    expect(second.migrationsApplied).toEqual([]);
  });

  it("returns a recoverable failure and preserves the original input when no path exists", () => {
    const result = runRichTextMigrations({ ...document, schemaVersion: "2025-01" });

    expect(result).toMatchObject({
      ok: false,
      code: "MIGRATION_FAILED",
      document: { schemaVersion: "2025-01" }
    });
  });

  it("returns a recoverable failure and preserves the original input when a migration throws", () => {
    const migrations: Migration[] = [
      {
        from: "2026-07",
        to: "2026-08",
        migrate: () => {
          throw new Error("boom");
        }
      }
    ];

    const result = runRichTextMigrations(document, {
      targetSchemaVersion: "2026-08",
      migrations
    });

    expect(result).toMatchObject({
      ok: false,
      code: "MIGRATION_FAILED",
      document: { schemaVersion: "2026-07" }
    });
  });
});
