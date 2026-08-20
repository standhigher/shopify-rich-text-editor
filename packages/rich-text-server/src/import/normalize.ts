import sanitizeHtml from "sanitize-html";

import type { RichTextWarning } from "@standhigher/shopify-rich-text-core";

const allowedTags = new Set([
  "a",
  "blockquote",
  "br",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "span",
  "strong",
  "ul",
  "u"
]);

export interface NormalizedHtmlImport {
  html: string;
  warnings: RichTextWarning[];
}

export function normalizeStandardHtml(html: string): NormalizedHtmlImport {
  const warnings = collectUnsupportedTagWarnings(html);
  const sanitized = sanitizeHtml(html, {
    allowedTags: [...allowedTags],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "title"],
      "*": []
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"]
    },
    disallowedTagsMode: "discard",
    transformTags: {
      h5: "h4",
      h6: "h4",
      span: "span",
      b: "strong",
      i: "em"
    }
  });

  const normalized = sanitized
    .replace(/<span>(.*?)<\/span>/gis, "$1")
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gis, "")
    .trim();

  if (normalized !== html.trim()) {
    warnings.push({
      code: "HTML_SANITIZED",
      message: "Unsupported or unsafe HTML was removed during import."
    });
  }

  return { html: normalized, warnings: dedupeWarnings(warnings) };
}

function collectUnsupportedTagWarnings(html: string): RichTextWarning[] {
  const warnings: RichTextWarning[] = [];
  const tagPattern = /<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)\b/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    if (!allowedTags.has(tagName) && tagName !== "b") {
      warnings.push({
        code: "UNSUPPORTED_HTML",
        message: `Unsupported HTML tag removed during import: ${tagName}`,
        details: { tagName }
      });
    }
  }

  return warnings;
}

function dedupeWarnings(warnings: RichTextWarning[]): RichTextWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
