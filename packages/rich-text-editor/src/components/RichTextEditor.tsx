"use client";

import { useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/core";
import { useEditor } from "@tiptap/react";

import { baseExtensions } from "../extensions/base";
import type { RichTextEditorProps } from "../types";
import { EditorContentArea } from "./EditorContentArea";
import { RichTextToolbar } from "./RichTextToolbar";

const CHANGE_DEBOUNCE_MS = 400;

export function RichTextEditor({
  value,
  onChange,
  onError,
  onUploadImage,
  placeholder,
  readOnly = false,
  disabled = false
}: RichTextEditorProps) {
  const changeTimerRef = useRef<number | undefined>(undefined);
  const pendingChangeRef = useRef<JSONContent | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: baseExtensions,
    content: value,
    editable: !readOnly && !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        "aria-label": placeholder ?? "Rich text editor",
        class: "bre-prosemirror"
      }
    },
    onUpdate({ editor }) {
      if (!onChange) return;

      window.clearTimeout(changeTimerRef.current);
      pendingChangeRef.current = editor.getJSON();
      changeTimerRef.current = window.setTimeout(() => {
        const content = pendingChangeRef.current;
        pendingChangeRef.current = undefined;
        if (content) onChangeRef.current?.(content);
      }, CHANGE_DEBOUNCE_MS);
    }
  });

  useEffect(() => {
    editor?.setEditable(!readOnly && !disabled);
  }, [editor, readOnly, disabled]);

  useEffect(() => {
    return () => {
      window.clearTimeout(changeTimerRef.current);
      const content = pendingChangeRef.current;
      pendingChangeRef.current = undefined;
      if (content) onChangeRef.current?.(content);
    };
  }, []);

  return (
    <div className="bre-root">
      {!readOnly ? (
        <RichTextToolbar
          editor={editor}
          readOnly={readOnly}
          disabled={disabled}
          onUploadImage={onUploadImage}
          onError={onError}
        />
      ) : null}
      <EditorContentArea editor={editor} readOnly={readOnly} />
    </div>
  );
}
