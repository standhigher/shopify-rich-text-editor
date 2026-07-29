"use client";

import { EditorContent, type Editor } from "@tiptap/react";

interface EditorContentAreaProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export function EditorContentArea({ editor, readOnly }: EditorContentAreaProps) {
  return (
    <div className="bre-editor-surface" data-readonly={readOnly ? "true" : "false"}>
      <EditorContent editor={editor} />
    </div>
  );
}

