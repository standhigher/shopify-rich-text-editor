import type { RichTextMark, RichTextNode } from "./types";

export type RichTextSerializer = (node: RichTextNode) => string;

export interface ToolbarItemDefinition {
  id: string;
  label: string;
  group?: string;
}

export interface RichTextExtensionClient<C = unknown> {
  extensions?: readonly C[];
  toolbarItems?: readonly ToolbarItemDefinition[];
}

export interface RichTextExtensionServer<S = unknown> {
  extensions?: readonly S[];
  serializers?: Readonly<Record<string, RichTextSerializer>>;
  plainTextSerializers?: Readonly<Record<string, RichTextSerializer>>;
}

export interface RichTextExtension<C = unknown, S = unknown> {
  id: string;
  version: string;
  dependencies?: readonly string[];
  nodes?: readonly string[];
  marks?: readonly string[];
  client?: RichTextExtensionClient<C>;
  server?: RichTextExtensionServer<S>;
}

export interface ResolvedExtensionRegistry<C = unknown, S = unknown> {
  extensions: readonly RichTextExtension<C, S>[];
  clientExtensions: readonly C[];
  serverExtensions: readonly S[];
  toolbarItems: readonly ToolbarItemDefinition[];
  nodeNames: ReadonlySet<string>;
  markNames: ReadonlySet<string>;
  serializers: Readonly<Record<string, RichTextSerializer>>;
  plainTextSerializers: Readonly<Record<string, RichTextSerializer>>;
}

export type ExtensionRegistryErrorCode =
  | "DUPLICATE_EXTENSION_ID"
  | "MISSING_EXTENSION_DEPENDENCY"
  | "EXTENSION_DEPENDENCY_CYCLE"
  | "NODE_NAME_CONFLICT"
  | "MARK_NAME_CONFLICT";

export class ExtensionRegistryError extends Error {
  readonly code: ExtensionRegistryErrorCode;
  readonly extensionId?: string;

  constructor(code: ExtensionRegistryErrorCode, message: string, extensionId?: string) {
    super(message);
    this.name = "ExtensionRegistryError";
    this.code = code;
    this.extensionId = extensionId;
  }
}

export function resolveExtensions<C, S>(
  extensions: readonly RichTextExtension<C, S>[]
): readonly RichTextExtension<C, S>[] {
  const byId = new Map<string, RichTextExtension<C, S>>();

  for (const extension of extensions) {
    if (byId.has(extension.id)) {
      throw new ExtensionRegistryError(
        "DUPLICATE_EXTENSION_ID",
        `Extension id is registered more than once: ${extension.id}`,
        extension.id
      );
    }
    byId.set(extension.id, extension);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const ordered: RichTextExtension<C, S>[] = [];

  const visit = (extension: RichTextExtension<C, S>): void => {
    if (visited.has(extension.id)) return;
    if (visiting.has(extension.id)) {
      throw new ExtensionRegistryError(
        "EXTENSION_DEPENDENCY_CYCLE",
        `Extension dependency cycle includes: ${extension.id}`,
        extension.id
      );
    }

    visiting.add(extension.id);
    for (const dependencyId of extension.dependencies ?? []) {
      const dependency = byId.get(dependencyId);
      if (!dependency) {
        throw new ExtensionRegistryError(
          "MISSING_EXTENSION_DEPENDENCY",
          `Extension ${extension.id} depends on missing extension ${dependencyId}`,
          extension.id
        );
      }
      visit(dependency);
    }
    visiting.delete(extension.id);
    visited.add(extension.id);
    ordered.push(extension);
  };

  for (const extension of extensions) visit(extension);
  assertNoNameConflicts(ordered);
  return ordered;
}

export function createExtensionRegistry<C, S>(
  extensions: readonly RichTextExtension<C, S>[]
): ResolvedExtensionRegistry<C, S> {
  const resolved = resolveExtensions(extensions);
  const nodeNames = new Set<string>();
  const markNames = new Set<string>();
  const clientExtensions: C[] = [];
  const serverExtensions: S[] = [];
  const toolbarItems: ToolbarItemDefinition[] = [];
  const serializers: Record<string, RichTextSerializer> = {};
  const plainTextSerializers: Record<string, RichTextSerializer> = {};

  for (const extension of resolved) {
    extension.nodes?.forEach((name) => nodeNames.add(name));
    extension.marks?.forEach((name) => markNames.add(name));
    clientExtensions.push(...(extension.client?.extensions ?? []));
    serverExtensions.push(...(extension.server?.extensions ?? []));
    toolbarItems.push(...(extension.client?.toolbarItems ?? []));
    Object.assign(serializers, extension.server?.serializers);
    Object.assign(plainTextSerializers, extension.server?.plainTextSerializers);
  }

  return {
    extensions: resolved,
    clientExtensions,
    serverExtensions,
    toolbarItems,
    nodeNames,
    markNames,
    serializers,
    plainTextSerializers
  };
}

function assertNoNameConflicts<C, S>(extensions: readonly RichTextExtension<C, S>[]): void {
  const nodeOwners = new Map<string, string>();
  const markOwners = new Map<string, string>();

  for (const extension of extensions) {
    for (const nodeName of extension.nodes ?? []) {
      const owner = nodeOwners.get(nodeName);
      if (owner && owner !== extension.id) {
        throw new ExtensionRegistryError(
          "NODE_NAME_CONFLICT",
          `Node name ${nodeName} is provided by both ${owner} and ${extension.id}`,
          extension.id
        );
      }
      nodeOwners.set(nodeName, extension.id);
    }
    for (const markName of extension.marks ?? []) {
      const owner = markOwners.get(markName);
      if (owner && owner !== extension.id) {
        throw new ExtensionRegistryError(
          "MARK_NAME_CONFLICT",
          `Mark name ${markName} is provided by both ${owner} and ${extension.id}`,
          extension.id
        );
      }
      markOwners.set(markName, extension.id);
    }
  }
}

export type { RichTextMark };
