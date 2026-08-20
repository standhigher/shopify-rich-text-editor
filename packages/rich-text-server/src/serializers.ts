import type { AnyExtension, JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import type { RichTextNode, RichTextSerializer } from "@standhigher/shopify-rich-text-core";

import { createServerExtensionRegistry, type ServerExtension } from "./extensions/registry";
import type { ShopifyResourceRenderOptions } from "./channels/resource-renderer";

export function richTextJsonToHtml(
  content: JSONContent,
  extensionContracts: readonly ServerExtension[] = [],
  renderOptions: ShopifyResourceRenderOptions = {}
): string {
  const registry = createServerExtensionRegistry(extensionContracts);
  const serverExtensions = configureResourceRenderer(registry.serverExtensions, renderOptions);
  if (containsCustomSerializer(content, registry.serializers)) {
    return renderHtmlWithSerializers(content, registry, serverExtensions);
  }
  return generateHTML(content, [...serverExtensions]);
}

function configureResourceRenderer(
  extensions: readonly AnyExtension[],
  options: ShopifyResourceRenderOptions
): readonly AnyExtension[] {
  return extensions.map((extension) =>
    extension.name === "shopifyResource" ? extension.configure(options) : extension
  );
}

export function richTextJsonToPlainText(
  content: JSONContent,
  extensionContracts: readonly ServerExtension[] = []
): string {
  const lines: string[] = [];

  const registry = createServerExtensionRegistry(extensionContracts);
  collectPlainText(content, lines, registry.plainTextSerializers);

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function collectPlainText(
  node: JSONContent,
  lines: string[],
  serializers: Readonly<Record<string, RichTextSerializer>>
): string {
  const serializer = node.type ? serializers[node.type] : undefined;
  if (serializer) return serializer(node as RichTextNode);

  if (node.type === "text") {
    return node.text ?? "";
  }

  const childText = node.content?.map((child) => collectPlainText(child, lines, serializers)).join("") ?? "";

  if (node.type === "doc" && childText) {
    lines.push(childText);
    return "";
  }

  if (node.type === "paragraph" || node.type === "heading" || node.type === "blockquote") {
    lines.push(childText);
    return "";
  }

  if (node.type === "listItem") {
    lines.push(childText);
    return "";
  }

  return childText;
}

function containsCustomSerializer(
  node: JSONContent,
  serializers: Readonly<Record<string, RichTextSerializer>>
): boolean {
  return Boolean(
    (node.type && serializers[node.type]) || node.content?.some((child) => containsCustomSerializer(child, serializers))
  );
}

function renderHtmlWithSerializers(
  node: JSONContent,
  registry: ReturnType<typeof createServerExtensionRegistry>,
  serverExtensions: readonly AnyExtension[] = registry.serverExtensions
): string {
  const serializer = node.type ? registry.serializers[node.type] : undefined;
  if (serializer) return serializer(node as RichTextNode);
  if (node.type === "doc") {
    return node.content?.map((child) => renderHtmlWithSerializers(child, registry, serverExtensions)).join("") ?? "";
  }

  return generateHTML({ type: "doc", content: [node] }, [...serverExtensions]);
}
