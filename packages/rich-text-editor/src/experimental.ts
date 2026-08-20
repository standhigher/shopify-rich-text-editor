/** @experimental Shopify Resource UI and provider helpers are opt-in APIs. */
export {
  createResourceProviderError,
  createResourceProviderExtension,
  selectResource,
  SHOPIFY_RESOURCE_PROVIDER_EXTENSION_NAME
} from "./providers/resource";
export type {
  ResourceProvider,
  ResourceProviderErrorCode,
  ResourceReference,
  ResourceSelectionOptions,
  ResourceType
} from "@standhigher/shopify-rich-text-core/experimental";
