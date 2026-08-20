export type RichTextErrorCode = "IMAGE_UPLOAD_FAILED";

export class RichTextError extends Error {
  readonly code: RichTextErrorCode;
  readonly recoverable: boolean;
  readonly cause: unknown;

  constructor(code: RichTextErrorCode, message: string, recoverable: boolean, cause: unknown) {
    super(message);
    this.name = "RichTextError";
    this.code = code;
    this.recoverable = recoverable;
    this.cause = cause;
  }
}
