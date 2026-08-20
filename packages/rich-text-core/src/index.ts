export {
  createExtensionRegistry,
  ExtensionRegistryError,
  resolveExtensions
} from "./extensions";
export type {
  RichTextExtension,
  RichTextExtensionClient,
  RichTextExtensionServer,
  RichTextSerializer,
  ResolvedExtensionRegistry,
  ToolbarItemDefinition
} from "./extensions";
export { RichTextError } from "./errors";
export { ResourceProviderError } from "./providers";
export type {
  ResourceProvider,
  ResourceProviderErrorCode,
  ResourceReference,
  ResourceSelectionOptions,
  ResourceType
} from "./providers";
export {
  CURRENT_RICH_TEXT_SCHEMA_VERSION,
  migrateDocument,
  MigrationError,
  RICH_TEXT_MIGRATIONS
} from "./migrations";
export type { Migration, MigrationErrorCode } from "./migrations";
export { runRichTextMigrations } from "./migration-runner";
export type {
  RichTextMigrationFailure,
  RichTextMigrationFailureCode,
  RichTextMigrationResult,
  RichTextMigrationSuccess,
  RunRichTextMigrationsOptions
} from "./migration-runner";
export { RICH_TEXT_PROTOCOL_VERSION } from "./types";
export type {
  EditorChangeContext,
  RichTextDocument,
  RichTextMark,
  RichTextNode,
  RichTextNodeAttrs,
  RichTextWarning
} from "./types";
export type { ExtensionRegistryErrorCode } from "./extensions";
