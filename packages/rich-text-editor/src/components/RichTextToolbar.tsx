"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Bold,
  Heading,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PackageOpen,
  Redo2,
  RemoveFormatting,
  RotateCcw,
  Underline as UnderlineIcon,
  Upload,
  Undo2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BlockStack,
  Button,
  InlineStack,
  Popover,
  Select,
  TextField,
  Tooltip
} from "@shopify/polaris";
import { useEditorState, type Editor } from "@tiptap/react";
import type { ResourceType } from "@standhigher/shopify-rich-text-core";

import { RichTextError } from "../errors";
import type { RichTextEditorProps, ShopifyImageUploadResult } from "../types";
import { selectResource } from "../providers/resource";

interface RichTextToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
  disabled?: boolean;
  onUploadImage?: RichTextEditorProps["onUploadImage"];
  resourceProvider?: RichTextEditorProps["resourceProvider"];
  onError?: RichTextEditorProps["onError"];
}

const blockOptions = [
  { label: "Paragraph", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" }
];

const resourceOptions = [
  { label: "Product", value: "product" },
  { label: "Collection", value: "collection" },
  { label: "Variant", value: "variant" }
];

const emptyToolbarState = {
  block: "paragraph",
  bold: false,
  bulletList: false,
  canRedo: false,
  canUndo: false,
  editable: false,
  italic: false,
  link: false,
  orderedList: false,
  underline: false,
  wordCount: 0
};

export function RichTextToolbar({
  editor,
  readOnly,
  disabled: disabledProp,
  onUploadImage,
  resourceProvider,
  onError
}: RichTextToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const [linkActive, setLinkActive] = useState(false);
  const [imageActive, setImageActive] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [resourceActive, setResourceActive] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceType>("product");
  const [isSelectingResource, setIsSelectingResource] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const toolbarState =
    useEditorState({
      editor,
      selector: ({ editor }) => {
        if (!editor) {
          return emptyToolbarState;
        }

        const block = editor.isActive("heading", { level: 1 })
          ? "h1"
          : editor.isActive("heading", { level: 2 })
            ? "h2"
            : editor.isActive("heading", { level: 3 })
              ? "h3"
              : editor.isActive("heading", { level: 4 })
                ? "h4"
                : "paragraph";

        return {
          block,
          bold: editor.isActive("bold"),
          bulletList: editor.isActive("bulletList"),
          canRedo: editor.can().redo(),
          canUndo: editor.can().undo(),
          editable: editor.isEditable,
          italic: editor.isActive("italic"),
          link: editor.isActive("link"),
          orderedList: editor.isActive("orderedList"),
          underline: editor.isActive("underline"),
          wordCount: editor.storage.characterCount?.words?.() ?? countWords(editor.getText())
        };
      }
    }) ?? emptyToolbarState;

  if (!editor) {
    return null;
  }

  const currentEditor = editor;
  const disabled = readOnly || disabledProp || !toolbarState.editable;

  function changeBlock(value: string) {
    if (value === "paragraph") {
      currentEditor.chain().focus().setParagraph().run();
      return;
    }

    const level = Number(value.replace("h", "")) as 1 | 2 | 3 | 4;
    currentEditor.chain().focus().toggleHeading({ level }).run();
  }

  function applyLink() {
    if (disabled) return;

    const href = linkUrl.trim();

    if (!href) {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkActive(false);
      return;
    }

    currentEditor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkActive(false);
  }

  function addImage(image: ShopifyImageUploadResult) {
    currentEditor
      .chain()
      .focus()
      .setImage({
        src: image.src,
        alt: image.alt,
        title: image.title
      })
      .run();
  }

  function applyImageUrl() {
    if (disabled) return;

    const src = imageUrl.trim();
    if (!src) return;

    addImage({ src });
    setImageUrl("");
    setImageActive(false);
  }

  async function applyResource() {
    if (disabled || !resourceProvider) return;

    setIsSelectingResource(true);
    try {
      const resource = await selectResource(resourceProvider, {
        resourceType,
        selectionLimit: 1
      });
      if (!resource || !isMountedRef.current || currentEditor.isDestroyed || !currentEditor.isEditable) return;

      currentEditor.chain().focus().insertShopifyResource(resource).run();
      setResourceActive(false);
    } catch (cause) {
      if (isMountedRef.current) {
        onError?.(new RichTextError("RESOURCE_SELECTION_FAILED", "Resource selection failed", true, cause));
      }
    } finally {
      if (isMountedRef.current) setIsSelectingResource(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onUploadImage) return;

    setIsUploading(true);
    try {
      const image = await onUploadImage(file);
      if (!isMountedRef.current || currentEditor.isDestroyed || !currentEditor.isEditable) return;
      addImage(image);
    } catch (cause) {
      if (isMountedRef.current) {
        onError?.(new RichTextError("IMAGE_UPLOAD_FAILED", "Image upload failed", true, cause));
      }
    } finally {
      if (isMountedRef.current) setIsUploading(false);
    }
  }

  return (
    <div className="bre-toolbar" aria-label="Rich text toolbar" role="toolbar">
      <div className="bre-toolbar-row">
        <div className="bre-toolbar-group bre-toolbar-group--block">
          <div className="bre-toolbar-select">
            <Select
              label="Block style"
              labelHidden
              options={blockOptions}
              value={toolbarState.block}
              disabled={disabled}
              onChange={changeBlock}
            />
          </div>
        </div>

        <ToolbarDivider />

        <ToolbarGroup label="Text formatting">
          <ToolbarIconButton
            label="Bold"
            active={toolbarState.bold}
            disabled={disabled}
            icon={Bold}
            onClick={() => currentEditor.chain().focus().toggleBold().run()}
          />
          <ToolbarIconButton
            label="Italic"
            active={toolbarState.italic}
            disabled={disabled}
            icon={Italic}
            onClick={() => currentEditor.chain().focus().toggleItalic().run()}
          />
          <ToolbarIconButton
            label="Underline"
            active={toolbarState.underline}
            disabled={disabled}
            icon={UnderlineIcon}
            onClick={() => currentEditor.chain().focus().toggleUnderline().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup label="Lists">
          <ToolbarIconButton
            label="Bullet list"
            active={toolbarState.bulletList}
            disabled={disabled}
            icon={List}
            onClick={() => currentEditor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarIconButton
            label="Ordered list"
            active={toolbarState.orderedList}
            disabled={disabled}
            icon={ListOrdered}
            onClick={() => currentEditor.chain().focus().toggleOrderedList().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup label="Insert">
          {resourceProvider ? (
            <Popover
              active={resourceActive}
              activator={
                <span>
                  <ToolbarIconButton
                    label="Insert Shopify resource"
                    disabled={disabled || isSelectingResource}
                    icon={PackageOpen}
                    onClick={() => setResourceActive((active) => !active)}
                  />
                </span>
              }
              autofocusTarget="first-node"
              onClose={() => setResourceActive(false)}
            >
              <Popover.Section>
                <BlockStack gap="300">
                  <Select
                    label="Resource type"
                    options={resourceOptions}
                    value={resourceType}
                    disabled={disabled || isSelectingResource}
                    onChange={(value) => setResourceType(value as ResourceType)}
                  />
                  <InlineStack gap="200">
                    <Button
                      disabled={disabled || isSelectingResource}
                      loading={isSelectingResource}
                      variant="primary"
                      onClick={applyResource}
                    >
                      Insert resource
                    </Button>
                    <Button disabled={isSelectingResource} onClick={() => setResourceActive(false)}>
                      Cancel
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Popover.Section>
            </Popover>
          ) : null}

          <Popover
            active={linkActive}
            activator={
              <span>
                <ToolbarIconButton
                  label="Link"
                  active={toolbarState.link}
                  disabled={disabled}
                  icon={LinkIcon}
                  onClick={() => setLinkActive((active) => !active)}
                />
              </span>
            }
            autofocusTarget="first-node"
            onClose={() => setLinkActive(false)}
          >
            <Popover.Section>
              <BlockStack gap="300">
                <TextField
                  autoComplete="off"
                  disabled={disabled}
                  label="URL"
                  value={linkUrl}
                  onChange={setLinkUrl}
                  placeholder="https://example.com"
                />
                <InlineStack gap="200">
                  <Button disabled={disabled} variant="primary" onClick={applyLink}>
                    Apply
                  </Button>
                  <Button disabled={disabled} onClick={() => setLinkActive(false)}>Cancel</Button>
                </InlineStack>
              </BlockStack>
            </Popover.Section>
          </Popover>

          <Popover
            active={imageActive}
            activator={
              <span>
                <ToolbarIconButton
                  label="Image URL"
                  disabled={disabled}
                  icon={ImageIcon}
                  onClick={() => setImageActive((active) => !active)}
                />
              </span>
            }
            autofocusTarget="first-node"
            onClose={() => setImageActive(false)}
          >
            <Popover.Section>
              <BlockStack gap="300">
                <TextField
                  autoComplete="off"
                  disabled={disabled}
                  label="Image URL"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://cdn.shopify.com/image.jpg"
                />
                <InlineStack gap="200">
                  <Button disabled={disabled} variant="primary" onClick={applyImageUrl}>
                    Insert
                  </Button>
                  <Button disabled={disabled} onClick={() => setImageActive(false)}>Cancel</Button>
                </InlineStack>
              </BlockStack>
            </Popover.Section>
          </Popover>

          <input
            ref={fileInputRef}
            className="bre-hidden-file-input"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
          <ToolbarIconButton
            label="Upload to Shopify"
            disabled={disabled || !onUploadImage || isUploading}
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup label="History">
          <ToolbarIconButton
            label="Undo"
            disabled={disabled || !toolbarState.canUndo}
            icon={Undo2}
            onClick={() => currentEditor.chain().focus().undo().run()}
          />
          <ToolbarIconButton
            label="Redo"
            disabled={disabled || !toolbarState.canRedo}
            icon={Redo2}
            onClick={() => currentEditor.chain().focus().redo().run()}
          />
        </ToolbarGroup>

        <ToolbarDivider />

        <ToolbarGroup label="Cleanup">
          <ToolbarIconButton
            label="Clear formatting"
            disabled={disabled}
            icon={RemoveFormatting}
            onClick={() => currentEditor.chain().focus().clearNodes().unsetAllMarks().run()}
          />
          <ToolbarIconButton
            label="Reset content"
            disabled={disabled}
            icon={RotateCcw}
            onClick={() => currentEditor.chain().focus().clearContent().run()}
          />
        </ToolbarGroup>

        <span className="bre-word-count">
          <Heading size={20} strokeWidth={1.5} aria-hidden="true" />
          {toolbarState.wordCount} words
        </span>
      </div>
    </div>
  );
}

interface ToolbarGroupProps {
  label: string;
  children: ReactNode;
}

function ToolbarGroup({ label, children }: ToolbarGroupProps) {
  return (
    <div className="bre-toolbar-group" aria-label={label}>
      {children}
    </div>
  );
}

function ToolbarDivider() {
  return <span className="bre-toolbar-divider" aria-hidden="true" />;
}

interface ToolbarIconButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick
}: ToolbarIconButtonProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        className="bre-toolbar-button"
        aria-label={label}
        aria-pressed={active}
        data-active={active ? "true" : "false"}
        disabled={disabled}
        onClick={onClick}
      >
        <span className="bre-toolbar-icon">
          <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </button>
    </Tooltip>
  );
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
