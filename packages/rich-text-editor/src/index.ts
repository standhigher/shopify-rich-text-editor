export { RichTextEditor } from "./components/RichTextEditor";
export { createEditorConfig, createEditorExtensionRegistry } from "./create-editor";
export { RichTextError } from "./errors";
export {
  createResourceProviderError,
  createResourceProviderExtension,
  selectResource,
  SHOPIFY_RESOURCE_PROVIDER_EXTENSION_NAME
} from "./providers/resource";
export type { RichTextErrorCode } from "./errors";
export type { EditorExtension } from "./create-editor";
export type { RichTextEditorProps, ShopifyImageUploadResult } from "./types";
