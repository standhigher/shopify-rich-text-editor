export const maliciousDocuments = {
  scriptText: {
    version: 1,
    schemaVersion: "2026-08",
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: '<script>alert("xss")</script>' }] }]
    }
  },
  eventAttributes: {
    version: 1,
    schemaVersion: "2026-08",
    content: {
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://cdn.shopify.com/image.jpg", onerror: "alert(1)" } }]
    }
  },
  dangerousLink: {
    version: 1,
    schemaVersion: "2026-08",
    content: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }]
    }
  },
  forgedResource: {
    version: 1,
    schemaVersion: "2026-08",
    content: {
      type: "doc",
      content: [{ type: "shopifyResource", attrs: { resourceType: "product", id: "gid://shopify/Product/1", accessToken: "secret" } }]
    }
  }
} as const;

export const oversizedDocument = {
  version: 1,
  schemaVersion: "2026-08",
  content: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(100_001) }] }]
  }
};

export function createDeepDocument(depth: number) {
  let content: Record<string, unknown> = { type: "paragraph", content: [{ type: "text", text: "deep" }] };
  for (let index = 0; index < depth; index += 1) {
    content = { type: "blockquote", content: [content] };
  }
  return { version: 1, schemaVersion: "2026-08", content: { type: "doc", content: [content] } };
}
