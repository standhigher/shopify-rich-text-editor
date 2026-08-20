export type RichTextValidationCode =
  | "INVALID_DOCUMENT"
  | "UNKNOWN_NODE"
  | "UNKNOWN_MARK"
  | "UNSAFE_URL"
  | "DOCUMENT_TOO_LARGE"
  | "DOCUMENT_TOO_DEEP";

export class RichTextValidationError extends Error {
  readonly code: RichTextValidationCode;
  readonly path: string;

  constructor(code: RichTextValidationCode, message: string, path = "content") {
    super(message);
    this.name = "RichTextValidationError";
    this.code = code;
    this.path = path;
  }
}
