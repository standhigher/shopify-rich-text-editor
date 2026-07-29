"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@tiptap/react";

import { baseExtensions } from "../extensions/base";
import type { RichTextEditorProps } from "../types";
import { EditorContentArea } from "./EditorContentArea";
import { RichTextToolbar } from "./RichTextToolbar";

const CHANGE_DEBOUNCE_MS = 400;

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
  readOnly = false
}: RichTextEditorProps) {
  const changeTimerRef = useRef<number | undefined>(undefined);
  const editor = useEditor({
    extensions: baseExtensions,
    content: value,
    editable: !readOnly,
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
      changeTimerRef.current = window.setTimeout(() => {
        onChange(editor.getJSON());
      }, CHANGE_DEBOUNCE_MS);
    }
  });

  useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    return () => {
      window.clearTimeout(changeTimerRef.current);
    };
  }, []);

  return (
    <div className="bre-root">
      {!readOnly ? (
        <RichTextToolbar editor={editor} readOnly={readOnly} onUploadImage={onUploadImage} />
      ) : null}
      <EditorContentArea editor={editor} readOnly={readOnly} />
    </div>
  );
}
