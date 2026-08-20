/** @experimental Shopify Resource support is not part of the frozen 1.0 core protocol. */
export type ResourceType = "product" | "collection" | "variant";

/** @experimental Provided by the host Shopify app; the editor does not own picker access. */
export interface ResourceSelectionOptions {
  resourceType: ResourceType;
  selectionLimit?: 1;
}

/** @experimental Resource snapshots are limited to display-safe fields. */
export interface ResourceReference {
  resourceType: ResourceType;
  id: string;
  title?: string;
  handle?: string;
  image?: string;
}

/** @experimental Inject a host-owned resource picker implementation. */
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
