import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AppProvider } from "@shopify/polaris";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichTextEditor } from "../src";

const emptyDocument = { type: "doc" as const, content: [] };

function renderEditor(resourceProvider?: React.ComponentProps<typeof RichTextEditor>["resourceProvider"]) {
  return render(
    <RichTextEditor value={emptyDocument} resourceProvider={resourceProvider} />,
    { wrapper: ({ children }) => <AppProvider i18n={{}}>{children}</AppProvider> }
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Shopify resource toolbar", () => {
  it("does not show resource controls without a provider", () => {
    renderEditor();

    expect(screen.queryByRole("button", { name: "Insert Shopify resource" })).toBeNull();
  });

  it("selects and inserts a product, collection, or variant resource", async () => {
    const provider = {
      selectResource: vi.fn().mockResolvedValue({
        resourceType: "collection" as const,
        id: "gid://shopify/Collection/200000000002",
        title: "Fixture Collection"
      })
    };
    renderEditor(provider);

    fireEvent.click(screen.getByRole("button", { name: "Insert Shopify resource" }));
    fireEvent.change(screen.getByLabelText("Resource type"), { target: { value: "collection" } });
    fireEvent.click(screen.getByRole("button", { name: "Insert resource" }));

    await waitFor(() => expect(provider.selectResource).toHaveBeenCalledWith({
      resourceType: "collection",
      selectionLimit: 1
    }));
    expect(document.querySelector('[data-resource-status="resolved"]')).not.toBeNull();
    expect(screen.getByText("Fixture Collection")).not.toBeNull();
  });

  it("does not create a node when the provider reports cancellation", async () => {
    const provider = { selectResource: vi.fn().mockResolvedValue(null) };
    renderEditor(provider);

    fireEvent.click(screen.getByRole("button", { name: "Insert Shopify resource" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert resource" }));

    await waitFor(() => expect(provider.selectResource).toHaveBeenCalledOnce());
    expect(document.querySelector(".bre-shopify-resource")).toBeNull();
  });
});
