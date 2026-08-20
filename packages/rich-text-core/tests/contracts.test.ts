import { describe, expect, it } from "vitest";

import {
  RICH_TEXT_PROTOCOL_VERSION,
  RichTextError,
  type RichTextDocument,
  type RichTextWarning
} from "../src";

describe("rich text core contracts", () => {
  it("exports the protocol version and document contract without UI dependencies", () => {
    const document: RichTextDocument = {
      version: RICH_TEXT_PROTOCOL_VERSION,
      schemaVersion: "2026-08",
      content: { type: "doc", content: [] }
    };

    expect(RICH_TEXT_PROTOCOL_VERSION).toBe(1);
    expect(document.content.type).toBe("doc");
  });

  it("provides structured errors and warnings", () => {
    const error = new RichTextError("CONTRACT_ERROR", "Invalid contract", true);
    const warning: RichTextWarning = {
      code: "DEPRECATED_SCHEMA",
      message: "Schema is deprecated",
      path: "schemaVersion"
    };

    expect(error).toMatchObject({ code: "CONTRACT_ERROR", recoverable: true });
    expect(warning.path).toBe("schemaVersion");
  });
});
