import { describe, expect, it, vi } from "vitest";

import {
  ResourceProviderError,
  type ResourceProvider,
  type ResourceSelectionOptions
} from "@standhigher/shopify-rich-text-core";

import { createEditorConfig } from "../src/create-editor";
import { selectResource } from "../src/providers/resource";

const selectionOptions: ResourceSelectionOptions = {
  resourceType: "product",
  selectionLimit: 1
};

const selectedResource = {
  resourceType: "product" as const,
  id: "gid://shopify/Product/100000000001",
  title: "Fixture Product",
  handle: "fixture-product"
};

describe("resource provider contract", () => {
  it("returns a selected resource and forwards selection options", async () => {
    const provider: ResourceProvider = {
      selectResource: vi.fn().mockResolvedValue(selectedResource)
    };

    await expect(selectResource(provider, selectionOptions)).resolves.toEqual(selectedResource);
    expect(provider.selectResource).toHaveBeenCalledWith(selectionOptions);
  });

  it("treats a user cancellation as an empty selection", async () => {
    const provider: ResourceProvider = {
      selectResource: vi.fn().mockResolvedValue(null)
    };

    await expect(selectResource(provider, selectionOptions)).resolves.toBeNull();
  });

  it.each([
    "PERMISSION_DENIED",
    "NETWORK_ERROR",
    "RESOURCE_NOT_FOUND"
  ] as const)("preserves the structured %s failure", async (code) => {
    const error = new ResourceProviderError(code, "Provider failed", code !== "PERMISSION_DENIED");
    const provider: ResourceProvider = {
      selectResource: vi.fn().mockRejectedValue(error)
    };

    await expect(selectResource(provider, selectionOptions)).rejects.toBe(error);
  });

  it("normalizes an unknown provider failure to a recoverable network error", async () => {
    const cause = new Error("request failed");
    const provider: ResourceProvider = {
      selectResource: vi.fn().mockRejectedValue(cause)
    };

    await expect(selectResource(provider, selectionOptions)).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      recoverable: true,
      cause
    });
  });

  it("registers a provider extension only when a provider is configured", () => {
    const provider: ResourceProvider = {
      selectResource: vi.fn()
    };

    const withoutProvider = createEditorConfig({ content: { type: "doc", content: [] } });
    const withProvider = createEditorConfig({
      content: { type: "doc", content: [] },
      resourceProvider: provider
    });

    expect(withoutProvider.extensions?.some((extension) => extension.name === "shopifyResourceProvider"))
      .toBe(false);
    expect(withProvider.extensions?.some((extension) => extension.name === "shopifyResourceProvider"))
      .toBe(true);
  });
});
