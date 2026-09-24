"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

type RichEditorProps = {
  value: string;
  onChange: (value: string) => void;
  initData?: string;
};

export default function RichEditor({
  value,
  onChange,
  initData,
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],

    content: value || "",

    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();

    if (value !== currentContent) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!initData) {
      alert("لم يتم العثور على بيانات Telegram.");
      event.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("يرجى اختيار صورة فقط.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("حجم الصورة يجب ألا يتجاوز 10MB.");
      event.target.value = "";
      return;
    }

    if (!editor) {
      alert("المحرر غير جاهز.");
      event.target.value = "";
      return;
    }

    try {
      const formData = new FormData();

      formData.append("file", file);
      formData.append("initData", initData);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.url) {
        throw new Error(result.error || "فشل رفع الصورة");
      }

      editor
        .chain()
        .focus()
        .setImage({
          src: result.url,
          alt: file.name,
        })
        .run();
    } catch (error) {
      console.error("Image upload error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء رفع الصورة."
      );
    } finally {
      event.target.value = "";
    }
  }

  if (!editor) {
    return (
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          minHeight: "300px",
        }}
      >
        جارٍ تحميل المحرر...
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          padding: "10px",
          borderBottom: "1px solid #ddd",
          background: "#f8f8f8",
        }}
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            padding: "7px 10px",
            fontWeight: "bold",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: editor.isActive("bold") ? "#ddd" : "#fff",
          }}
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          style={{
            padding: "7px 10px",
            fontStyle: "italic",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: editor.isActive("italic") ? "#ddd" : "#fff",
          }}
        >
          I
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            padding: "7px 10px",
            textDecoration: "underline",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: editor.isActive("underline") ? "#ddd" : "#fff",
          }}
        >
          U
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: editor.isActive("heading", { level: 2 })
              ? "#ddd"
              : "#fff",
          }}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: editor.isActive("heading", { level: 3 })
              ? "#ddd"
              : "#fff",
          }}
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          • قائمة
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          1. قائمة
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          ❝
        </button>

        <button
          type="button"
          onClick={() => {
            const url = window.prompt("أدخل الرابط:");

            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          🔗
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          🖼️ صورة
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          ↶
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          style={{
            padding: "7px 10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          ↷
        </button>
      </div>

      <div
        style={{
          padding: "16px",
          minHeight: "300px",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
