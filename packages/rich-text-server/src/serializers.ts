import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";

import { serverExtensions } from "./extensions";

export function richTextJsonToHtml(content: JSONContent): string {
  return generateHTML(content, serverExtensions);
}

export function richTextJsonToPlainText(content: JSONContent): string {
  const lines: string[] = [];

  collectPlainText(content, lines);

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function collectPlainText(node: JSONContent, lines: string[]): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  const childText = node.content?.map((child) => collectPlainText(child, lines)).join("") ?? "";

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

