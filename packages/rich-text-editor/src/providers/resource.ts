import { Extension } from "@tiptap/core";
import {
  ResourceProviderError,
  type ResourceProvider,
  type ResourceProviderErrorCode,
  type ResourceReference,
  type ResourceSelectionOptions
} from "@standhigher/shopify-rich-text-core";

export const SHOPIFY_RESOURCE_PROVIDER_EXTENSION_NAME = "shopifyResourceProvider";

export function createResourceProviderExtension(provider: ResourceProvider) {
  return Extension.create({
    name: SHOPIFY_RESOURCE_PROVIDER_EXTENSION_NAME,
    addStorage() {
      return { provider };
    }
  });
}

export async function selectResource(
  provider: ResourceProvider,
  options: ResourceSelectionOptions
): Promise<ResourceReference | null> {
  try {
    return await provider.selectResource(options);
  } catch (cause) {
    if (cause instanceof ResourceProviderError) {
      throw cause;
    }

    throw new ResourceProviderError(
      "NETWORK_ERROR",
      "Resource selection failed",
      true,
      cause
    );
  }
}

export function createResourceProviderError(
  code: ResourceProviderErrorCode,
  message: string,
  recoverable = code !== "PERMISSION_DENIED",
  cause?: unknown
): ResourceProviderError {
  return new ResourceProviderError(code, message, recoverable, cause);
}
