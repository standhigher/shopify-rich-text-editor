import type { JSONContent } from "@tiptap/core";
import type { RichTextWarning } from "@standhigher/shopify-rich-text-core";

import type { RichTextChannel } from "../result";

export type ChannelCapabilitySupport = "supported" | "degraded" | "unsupported";
export type ChannelCapabilityKind = "node" | "mark";

export interface ChannelCapability {
  support: ChannelCapabilitySupport;
  reason?: string;
}

export interface ChannelCapabilityMatrix {
  channel: RichTextChannel;
  nodes: Record<string, ChannelCapability>;
  marks: Record<string, ChannelCapability>;
}

const supported: ChannelCapability = { support: "supported" };

export const shopifyHtmlCapabilities: ChannelCapabilityMatrix = {
  channel: "shopify-html",
  nodes: {
    doc: supported,
    paragraph: supported,
    text: supported,
    heading: supported,
    blockquote: supported,
    bulletList: supported,
    orderedList: supported,
    listItem: supported,
    hardBreak: supported,
    image: supported,
    shopifyResource: supported,
    codeBlock: {
      support: "degraded",
      reason: "Shopify HTML rich text output does not preserve code block semantics in the stable allowlist."
    },
    horizontalRule: {
      support: "degraded",
      reason: "Horizontal rules are removed by the Shopify HTML sanitizer allowlist."
    }
  },
  marks: {
    bold: supported,
    italic: supported,
    underline: supported,
    link: supported,
    code: {
      support: "degraded",
      reason: "Inline code styling is flattened for Shopify HTML."
    },
    strike: {
      support: "degraded",
      reason: "Strike formatting is flattened for Shopify HTML."
    }
  }
};

export function getChannelCapability(
  channel: RichTextChannel,
  kind: ChannelCapabilityKind,
  name: string
): ChannelCapability {
  const matrix = getChannelCapabilityMatrix(channel);
  const capability = kind === "node" ? matrix.nodes[name] : matrix.marks[name];
  return capability ?? {
    support: "unsupported",
    reason: `${kind} ${name} is not supported by ${channel}.`
  };
}

export function getChannelCapabilityMatrix(channel: RichTextChannel): ChannelCapabilityMatrix {
  if (channel === "shopify-html") return shopifyHtmlCapabilities;
  return shopifyHtmlCapabilities;
}

export function collectChannelWarnings(content: JSONContent, channel: RichTextChannel): RichTextWarning[] {
  const warnings: RichTextWarning[] = [];
  walk(content, "content", (node, path) => {
    if (node.type) {
      const capability = getChannelCapability(channel, "node", node.type);
      pushCapabilityWarning(warnings, capability, "node", node.type, path, channel);
    }

    node.marks?.forEach((mark, index) => {
      const capability = getChannelCapability(channel, "mark", mark.type);
      pushCapabilityWarning(warnings, capability, "mark", mark.type, `${path}.marks[${index}]`, channel);
    });
  });
  return warnings;
}

function pushCapabilityWarning(
  warnings: RichTextWarning[],
  capability: ChannelCapability,
  kind: ChannelCapabilityKind,
  name: string,
  path: string,
  channel: RichTextChannel
): void {
  if (capability.support === "supported") return;

  warnings.push({
    code:
      capability.support === "degraded"
        ? `CHANNEL_${kind.toUpperCase()}_DEGRADED`
        : `CHANNEL_${kind.toUpperCase()}_UNSUPPORTED`,
    message: capability.reason ?? `${kind} ${name} is ${capability.support} by ${channel}.`,
    path,
    details: { channel, [`${kind}Type`]: name, support: capability.support }
  });
}

function walk(node: JSONContent, path: string, visit: (node: JSONContent, path: string) => void): void {
  visit(node, path);
  node.content?.forEach((child, index) => walk(child, `${path}.content[${index}]`, visit));
}
