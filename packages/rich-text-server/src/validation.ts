import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

import type { RichTextDocument } from "./types";

const jsonContentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.string().optional(),
      attrs: z.record(z.unknown()).optional(),
      content: z.array(jsonContentSchema).optional(),
      marks: z
        .array(
          z.object({
            type: z.string(),
            attrs: z.record(z.unknown()).optional()
          })
        )
        .optional(),
      text: z.string().optional()
    })
    .passthrough()
);

const richTextDocumentSchema = z.object({
  version: z.number().int().positive(),
  schemaVersion: z.string().min(1),
  content: jsonContentSchema.refine((content) => content.type === "doc", {
    message: "content must be a Tiptap doc"
  }),
  plainText: z.string().optional()
});

export function validateRichTextDocument(value: unknown): RichTextDocument {
  const result = richTextDocumentSchema.safeParse(value);

  if (!result.success) {
    throw new Error(`Invalid rich text document: ${result.error.message}`);
  }

  return result.data;
}

