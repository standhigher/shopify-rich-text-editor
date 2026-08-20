export type ResourceType = "product" | "collection" | "variant";

export interface ResourceSelectionOptions {
  resourceType: ResourceType;
  selectionLimit?: 1;
}

export interface ResourceReference {
  resourceType: ResourceType;
  id: string;
  title?: string;
  handle?: string;
  image?: string;
}

export interface ResourceProvider {
  selectResource(options: ResourceSelectionOptions): Promise<ResourceReference | null>;
}

export type ResourceProviderErrorCode =
  | "PERMISSION_DENIED"
  | "NETWORK_ERROR"
  | "RESOURCE_NOT_FOUND";

export class ResourceProviderError extends Error {
  readonly code: ResourceProviderErrorCode;
  readonly recoverable: boolean;
  readonly cause: unknown;

  constructor(
    code: ResourceProviderErrorCode,
    message: string,
    recoverable: boolean,
    cause?: unknown
  ) {
    super(message);
    this.name = "ResourceProviderError";
    this.code = code;
    this.recoverable = recoverable;
    this.cause = cause;
  }
}
