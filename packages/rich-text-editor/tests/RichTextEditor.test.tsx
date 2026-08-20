import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AppProvider } from "@shopify/polaris";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { JSONContent } from "@tiptap/core";

import { RichTextEditor } from "../src";

const documentWithText = (text: string): JSONContent => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }]
});

function renderEditor(props: React.ComponentProps<typeof RichTextEditor>) {
  return render(<RichTextEditor {...props} />, {
    wrapper: ({ children }) => <AppProvider i18n={{}}>{children}</AppProvider>
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("RichTextEditor public component", () => {
  it("renders the initial value", () => {
    renderEditor({ value: documentWithText("Initial content") });

    expect(screen.getByText("Initial content")).not.toBeNull();
  });

  it("calls onChange with the updated document after editing", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();

    renderEditor({ value: documentWithText("Initial content"), onChange });
    const editor = document.querySelector('[aria-label="Rich text editor"]') as HTMLElement;

    fireEvent.input(editor, { inputType: "insertText", data: "Updated content" });
    act(() => vi.advanceTimersByTime(400));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "doc" }));
  });

  it("flushes the last valid change before unmounting", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const { unmount } = renderEditor({ value: documentWithText("Initial content"), onChange });
    const editor = document.querySelector('[aria-label="Rich text editor"]') as HTMLElement;

    fireEvent.input(editor, { inputType: "insertText", data: "Updated content" });
    fireEvent.input(editor, { inputType: "insertText", data: "Final content" });
    unmount();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ type: "doc" }));
  });

  it("reports a recoverable structured error when image upload fails", async () => {
    const cause = new Error("upload failed");
    const onError = vi.fn();
    const onUploadImage = vi.fn().mockRejectedValue(cause);

    renderEditor({ value: documentWithText("Content"), onUploadImage, onError });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["image"], "image.png", { type: "image/png" })] } });

    await waitFor(() => expect(onError).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "IMAGE_UPLOAD_FAILED",
        message: "Image upload failed",
        recoverable: true,
        cause
      })
    );
    expect(document.querySelector("img")).toBeNull();
  });

  it("inserts the returned image after a successful upload", async () => {
    const onUploadImage = vi.fn().mockResolvedValue({ src: "https://cdn.example.com/image.png", alt: "Uploaded" });

    renderEditor({ value: documentWithText("Content"), onUploadImage });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["image"], "image.png", { type: "image/png" })] } });

    await waitFor(() => expect(document.querySelector('img[src="https://cdn.example.com/image.png"]')).not.toBeNull());
    expect(onUploadImage).toHaveBeenCalledOnce();
  });

  it("does not update the editor after an upload resolves post-unmount", async () => {
    let resolveUpload!: (result: { src: string }) => void;
    const onError = vi.fn();
    const onUploadImage = vi.fn().mockReturnValue(
      new Promise<{ src: string }>((resolve) => {
        resolveUpload = resolve;
      })
    );

    const { unmount } = renderEditor({ value: documentWithText("Content"), onUploadImage, onError });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["image"], "image.png", { type: "image/png" })] } });
    unmount();
    resolveUpload({ src: "https://cdn.example.com/image.png" });
    await act(async () => {});

    expect(onError).not.toHaveBeenCalled();
  });

  it("does not insert an image when an upload resolves after editing is disabled", async () => {
    let resolveUpload!: (result: { src: string }) => void;
    const onUploadImage = vi.fn().mockReturnValue(
      new Promise<{ src: string }>((resolve) => {
        resolveUpload = resolve;
      })
    );
    const { rerender } = renderEditor({ value: documentWithText("Content"), onUploadImage });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["image"], "image.png", { type: "image/png" })] } });

    rerender(
      <AppProvider i18n={{}}>
        <RichTextEditor value={documentWithText("Content")} disabled onUploadImage={onUploadImage} />
      </AppProvider>
    );
    resolveUpload({ src: "https://cdn.example.com/image.png" });
    await act(async () => {});

    expect(document.querySelector("img")).toBeNull();
  });

  it("prevents an already open link popover from submitting when the editor becomes disabled", () => {
    const { rerender } = renderEditor({ value: documentWithText("Content") });

    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(screen.getByLabelText("URL")).not.toBeNull();

    rerender(
      <AppProvider i18n={{}}>
        <RichTextEditor value={documentWithText("Content")} disabled />
      </AppProvider>
    );

    expect(screen.queryByLabelText("URL")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
  });

  it("does not expose an editable surface or toolbar in read-only mode", async () => {
    renderEditor({ value: documentWithText("Read only content"), readOnly: true });

    expect(screen.getByText("Read only content")).not.toBeNull();
    expect(screen.queryByRole("toolbar")).toBeNull();
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Rich text editor"]')?.getAttribute("contenteditable")).toBe("false");
    });
  });

  it("keeps the toolbar visible but disables editing controls when disabled", async () => {
    renderEditor({ value: documentWithText("Disabled content"), disabled: true });

    expect(screen.getByText("Disabled content")).not.toBeNull();
    expect(screen.getByLabelText("Rich text toolbar")).not.toBeNull();
    await waitFor(() => {
      expect(document.querySelector('[aria-label="Rich text editor"]')?.getAttribute("contenteditable")).toBe("false");
    });
    expect((screen.getByRole("button", { name: "Bold" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Block style") as HTMLSelectElement).disabled).toBe(true);
  });

  it("updates editing and toolbar controls when disabled and read-only modes change", async () => {
    const { rerender } = renderEditor({ value: documentWithText("Toggle content"), disabled: true });

    await waitFor(() => {
      expect(document.querySelector('[aria-label="Rich text editor"]')?.getAttribute("contenteditable")).toBe("false");
    });
    expect(screen.getByLabelText("Rich text toolbar")).not.toBeNull();
    expect((screen.getByRole("button", { name: "Bold" }) as HTMLButtonElement).disabled).toBe(true);

    rerender(
      <AppProvider i18n={{}}>
        <RichTextEditor value={documentWithText("Toggle content")} />
      </AppProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[aria-label="Rich text editor"]')?.getAttribute("contenteditable")).toBe("true");
    });
    expect((screen.getByRole("button", { name: "Bold" }) as HTMLButtonElement).disabled).toBe(false);

    rerender(
      <AppProvider i18n={{}}>
        <RichTextEditor value={documentWithText("Toggle content")} readOnly />
      </AppProvider>
    );

    await waitFor(() => {
      expect(document.querySelector('[aria-label="Rich text editor"]')?.getAttribute("contenteditable")).toBe("false");
    });
    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("replaces the rendered content when the external value changes", () => {
    const { rerender } = renderEditor({ value: documentWithText("First value") });

    rerender(
      <AppProvider i18n={{}}>
        <RichTextEditor value={documentWithText("Replacement value")} />
      </AppProvider>
    );

    expect(screen.getByText("Replacement value")).not.toBeNull();
    expect(screen.queryByText("First value")).toBeNull();
  });

  it("renders an empty document without throwing", () => {
    renderEditor({ value: { type: "doc", content: [] } });

    expect(document.querySelector('[aria-label="Rich text editor"]')).not.toBeNull();
  });
});
