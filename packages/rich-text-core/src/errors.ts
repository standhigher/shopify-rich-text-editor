export class RichTextError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly cause: unknown;

  constructor(code: string, message: string, recoverable = false, cause?: unknown) {
    super(message);
    this.name = "RichTextError";
    this.code = code;
    this.recoverable = recoverable;
    this.cause = cause;
  }
}
