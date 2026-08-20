import React, { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Badge,
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Text
} from "@shopify/polaris";
import type { JSONContent } from "@tiptap/core";
import {
  createRichTextDocument,
  type RichTextNode,
  type ResourceProvider,
  type ResourceReference,
  type ResourceSelectionOptions
} from "@standhigher/shopify-rich-text-core";

import type { ShopifyImageUploadResult } from "../types";
import { RichTextEditor } from "./RichTextEditor";

const meta = {
  title: "Editor/RichTextEditor",
  component: RichTextEditor,
  tags: ["autodocs"]
} satisfies Meta<typeof RichTextEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

const richContent: JSONContent = {
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
          content: [{ type: "paragraph", content: [{ type: "text", text: "JSON is the source of truth" }] }]
        },
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "HTML is rendered on the server" }] }]
        }
      ]
    }
  ]
};

const resourceContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Featured offer" }]
    },
    {
      type: "shopifyResource",
      attrs: {
        resourceType: "product",
        id: "gid://shopify/Product/100000000001",
        title: "Fixture Product",
        handle: "fixture-product",
        image: "https://cdn.shopify.com/s/files/fixture/product.png"
      }
    },
    {
      type: "shopifyResource",
      attrs: {
        resourceType: "collection",
        id: "gid://shopify/Collection/200000000002",
        title: "Fixture Collection",
        handle: "fixture-collection",
        image: "https://cdn.shopify.com/s/files/fixture/collection.png"
      }
    }
  ]
};

const resources: Record<ResourceReference["resourceType"], ResourceReference> = {
  product: {
    resourceType: "product",
    id: "gid://shopify/Product/100000000001",
    title: "Fixture Product",
    handle: "fixture-product",
    image: "https://cdn.shopify.com/s/files/fixture/product.png"
  },
  collection: {
    resourceType: "collection",
    id: "gid://shopify/Collection/200000000002",
    title: "Fixture Collection",
    handle: "fixture-collection",
    image: "https://cdn.shopify.com/s/files/fixture/collection.png"
  },
  variant: {
    resourceType: "variant",
    id: "gid://shopify/ProductVariant/300000000003",
    title: "Fixture Variant",
    handle: "fixture-variant",
    image: "https://cdn.shopify.com/s/files/fixture/variant.png"
  }
};

const mockResourceProvider: ResourceProvider = {
  async selectResource({ resourceType }: ResourceSelectionOptions) {
    return resources[resourceType];
  }
};

const unavailableResourceProvider: ResourceProvider = {
  async selectResource() {
    throw new Error("Resource picker unavailable in this environment");
  }
};

async function mockUpload(file: File): Promise<ShopifyImageUploadResult> {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");

  return {
    src: `https://cdn.shopify.com/s/files/1/0000/files/${safeName}`,
    alt: file.name.replace(/\.[^.]+$/, ""),
    title: "Uploaded fixture image",
    shopifyFileId: `gid://shopify/MediaImage/storybook-${Date.now()}`
  };
}

function EditorStory({
  initialValue,
  readOnly = false,
  placeholder = "Write Shopify product content",
  resourceProvider,
  onUploadImage,
  narrow = false,
  showDeveloperPanels = false
}: {
  initialValue: JSONContent;
  readOnly?: boolean;
  placeholder?: string;
  resourceProvider?: ResourceProvider;
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
  narrow?: boolean;
  showDeveloperPanels?: boolean;
}) {
  const [content, setContent] = useState<JSONContent>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const document = useMemo(() => createRichTextDocument(content as RichTextNode), [content]);

  const editor = (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h2" variant="headingMd">
            Editor
          </Text>
          <Badge tone={readOnly ? "info" : "success"}>{readOnly ? "Read-only" : "Interactive"}</Badge>
        </InlineStack>
        <RichTextEditor
          value={content}
          placeholder={placeholder}
          readOnly={readOnly}
          resourceProvider={resourceProvider}
          onUploadImage={onUploadImage}
          onChange={setContent}
          onError={(nextError) => setError(nextError.message)}
        />
        {error ? (
          <Text as="p" tone="critical">
            {error}
          </Text>
        ) : null}
      </BlockStack>
    </Card>
  );

  return (
    <div style={{ maxWidth: narrow ? 420 : 1120, margin: "0 auto" }}>
      <BlockStack gap="400">
        {showDeveloperPanels ? (
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {editor}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Persisted JSON
                </Text>
                <pre style={{ overflow: "auto", maxHeight: 520, margin: 0 }}>
                  {JSON.stringify(document, null, 2)}
                </pre>
              </BlockStack>
            </Card>
          </InlineGrid>
        ) : (
          editor
        )}
      </BlockStack>
    </div>
  );
}

export const Default: Story = {
  args: {
    value: emptyContent
  },
  render: () => <EditorStory initialValue={emptyContent} />
};

export const WithInitialRichContent: Story = {
  args: {
    value: richContent
  },
  render: () => <EditorStory initialValue={richContent} />
};

export const ReadOnlyPreview: Story = {
  args: {
    value: richContent
  },
  render: () => <EditorStory initialValue={richContent} readOnly />
};

export const MockedImageUpload: Story = {
  args: {
    value: richContent
  },
  render: () => <EditorStory initialValue={richContent} onUploadImage={mockUpload} />
};

export const ShopifyResources: Story = {
  args: {
    value: resourceContent
  },
  render: () => (
    <EditorStory
      initialValue={resourceContent}
      resourceProvider={mockResourceProvider}
      showDeveloperPanels
    />
  )
};

export const EmptyPlaceholder: Story = {
  args: {
    value: emptyContent
  },
  render: () => <EditorStory initialValue={emptyContent} placeholder="Write a landing page section" />
};

export const NarrowViewport: Story = {
  args: {
    value: richContent
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1"
    }
  },
  render: () => <EditorStory initialValue={richContent} narrow />
};

export const ResourceProviderUnavailable: Story = {
  args: {
    value: resourceContent
  },
  render: () => (
    <EditorStory
      initialValue={resourceContent}
      resourceProvider={unavailableResourceProvider}
    />
  )
};

export const PersistedJsonPreview: Story = {
  args: {
    value: richContent
  },
  render: () => <EditorStory initialValue={richContent} showDeveloperPanels />
};
