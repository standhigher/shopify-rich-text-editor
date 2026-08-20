/**
 * Experimental APIs are exposed from a named entry point for new integrations.
 * The root exports remain available as a 0.6.x compatibility surface.
 */
export {
  ResourceProviderError,
  type ResourceProvider,
  type ResourceProviderErrorCode,
  type ResourceReference,
  type ResourceSelectionOptions,
  type ResourceType
} from "./providers";
