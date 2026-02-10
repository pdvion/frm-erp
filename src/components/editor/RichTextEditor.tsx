"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { EditorToolbar } from "./EditorToolbar";
import { cn } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

export interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Digite o conteúdo aqui...",
  editable = true,
  minHeight = "200px",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base max-w-none focus:outline-none",
          "prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
          "prose-p:text-gray-700 dark:prose-p:text-gray-300",
          "prose-a:text-blue-600 dark:prose-a:text-blue-400",
          "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
          "prose-ul:list-disc prose-ol:list-decimal",
          "prose-li:text-gray-700 dark:prose-li:text-gray-300",
          "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-gray-900 prose-pre:text-gray-100"
        ),
      },
    },
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "border border-theme rounded-lg bg-theme-secondary animate-pulse",
          className
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "border border-theme rounded-lg overflow-hidden bg-theme-card",
        "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
        className
      )}
    >
      {editable && <EditorToolbar editor={editor} />}
      <div
        className="p-4 overflow-auto"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export interface RichTextViewerProps {
  content: string;
  className?: string;
}

export function RichTextViewer({ content, className }: RichTextViewerProps) {
  return (
    <div
      className={cn(
        "prose prose-sm sm:prose-base max-w-none",
        "prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
        "prose-p:text-gray-700 dark:prose-p:text-gray-300",
        "prose-a:text-blue-600 dark:prose-a:text-blue-400",
        "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:text-gray-700 dark:prose-li:text-gray-300",
        "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100",
        className
      )}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  );
}
