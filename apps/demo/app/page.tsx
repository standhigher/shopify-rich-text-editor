"use client";

import { useEffect, useMemo, useState } from "react";
import { AppProvider, BlockStack, Card, InlineStack, Text } from "@shopify/polaris";
import type { JSONContent } from "@tiptap/core";
import { RichTextEditor, type ShopifyImageUploadResult } from "@best-rich-editor/rich-text-editor";

interface RichTextDocument {
  version: number;
  schemaVersion: string;
  content: JSONContent;
  plainText?: string;
}

const initialContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Everyday linen shirt" }]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "A breathable product description with " },
        { type: "text", marks: [{ type: "bold" }], text: "Shopify-safe HTML" },
        { type: "text", text: " output." }
      ]
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "JSON is the source of truth" }]
            }
          ]
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "HTML is rendered and sanitized on the server" }]
            }
          ]
        }
      ]
    }
  ]
};

export default function DemoPage() {
  const [content, setContent] = useState<JSONContent>(initialContent);
  const [shopifyHtml, setShopifyHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);

  const document = useMemo<RichTextDocument>(
    () => ({
      version: 1,
      schemaVersion: "2026-07",
      content,
      plainText
    }),
    [content, plainText]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/render-shopify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            version: 1,
            schemaVersion: "2026-07",
            content
          }),
          signal: controller.signal
        });

        const result = (await response.json()) as {
          html?: string;
          plainText?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to render Shopify HTML");
        }

        setShopifyHtml(result.html ?? "");
        setPlainText(result.plainText ?? "");
        setRenderError(null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setRenderError(error instanceof Error ? error.message : "Unable to render Shopify HTML");
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [content]);

  async function uploadToShopify(file: File): Promise<ShopifyImageUploadResult> {
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");

    return {
      src: `https://cdn.shopify.com/s/files/1/0000/files/${safeName}`,
      alt: file.name.replace(/\.[^.]+$/, ""),
      title: "Uploaded to Shopify",
      shopifyFileId: `gid://shopify/MediaImage/demo-${Date.now()}`
    };
  }

  return (
    <AppProvider i18n={{}}>
      <main className="demo-shell">
        <div className="demo-page">
          <header className="demo-header">
            <h1 className="demo-title">Best Rich Editor</h1>
            <p className="demo-subtitle">
              Reusable Shopify App rich text editor powered by Tiptap JSON and server-side
              channel adapters.
            </p>
          </header>
          <BlockStack gap="400">
            <div className="demo-grid">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Editor
                    </Text>
                    <RichTextEditor
                      value={content}
                      placeholder="Write Shopify product content"
                      onChange={setContent}
                      onUploadImage={uploadToShopify}
                    />
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="300">
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        Read-only preview
                      </Text>
                      <Text as="span" tone="subdued">
                        {plainText.split(/\s+/).filter(Boolean).length} words
                      </Text>
                    </InlineStack>
                    <RichTextEditor value={content} readOnly />
                  </BlockStack>
                </Card>
              </BlockStack>

              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Shopify HTML
                    </Text>
                    {renderError ? (
                      <Text as="p" tone="critical">
                        {renderError}
                      </Text>
                    ) : (
                      <div
                        className="demo-html-preview"
                        dangerouslySetInnerHTML={{ __html: shopifyHtml }}
                      />
                    )}
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="300">
                    <Text as="h2" variant="headingMd">
                      Persisted JSON
                    </Text>
                    <pre className="demo-output">{JSON.stringify(document, null, 2)}</pre>
                  </BlockStack>
                </Card>
              </BlockStack>
            </div>
          </BlockStack>
        </div>
      </main>
    </AppProvider>
  );
}
