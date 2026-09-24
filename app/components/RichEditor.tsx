"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichEditor({
  value,
  onChange,
}: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],

    content: value,

    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div
        style={{
          minHeight: 300,
          padding: 15,
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          color: "#94a3b8",
        }}
      >
        جارٍ تحميل المحرر...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl =
      editor.getAttributes("link").href;

    const url = window.prompt(
      "أدخل الرابط:",
      previousUrl || "https://"
    );

    if (url === null) {
      return;
    }

    if (url === "") {
      editor
        .chain()
        .focus()
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .setLink({
        href: url,
      })
      .run();
  };

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      {/* Toolbar */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: 10,
          borderBottom:
            "1px solid #e2e8f0",
          background: "#f8fafc",
        }}
      >
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBold()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive("bold")
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          B
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleItalic()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "italic"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
            fontStyle: "italic",
          }}
        >
          I
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleUnderline()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "underline"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          U
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "heading",
              { level: 2 }
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({
                level: 3,
              })
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "heading",
              { level: 3 }
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "bulletList"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
          }}
        >
          • قائمة
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "orderedList"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
          }}
        >
          1. قائمة
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "blockquote"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
          }}
        >
          ❝ اقتباس
        </button>

        <button
          type="button"
          onClick={setLink}
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: editor.isActive(
              "link"
            )
              ? "#e2e8f0"
              : "#ffffff",
            cursor: "pointer",
          }}
        >
          🔗 رابط
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .undo()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          ↶
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .redo()
              .run()
          }
          style={{
            padding: "8px 11px",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            cursor: "pointer",
          }}
        >
          ↷
        </button>
      </div>

      {/* Editor */}

      <EditorContent
        editor={editor}
        style={{
          minHeight: 320,
          padding: 18,
          direction: "rtl",
          textAlign: "right",
          lineHeight: 1.9,
          fontSize: 17,
        }}
      />
    </div>
  );
}
