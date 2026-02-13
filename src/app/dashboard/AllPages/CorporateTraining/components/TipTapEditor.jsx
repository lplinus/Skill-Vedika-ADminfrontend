"use client";

import { useEffect, useState, useMemo } from "react";
// import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import {FiBold,FiItalic,FiUnderline,FiList,FiRotateCcw,FiRotateCw,FiType,
  FiCode,FiImage,FiLink,FiAlignLeft,FiAlignCenter,FiAlignRight,FiAlignJustify,} from "react-icons/fi";
import { BiParagraph } from "react-icons/bi";
import { uploadToCloudinary } from "@/services/cloudinaryUpload";
import toast from "react-hot-toast";
import { useEditor, useEditorState,EditorContent } from "@tiptap/react";//newly added


/* =========================================================
   FIXED: Move sub-components OUTSIDE TipTapEditor
========================================================= */

function ToolbarButton({ command, active, Icon, children, title, disabled }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) command();
      }}
      disabled={disabled}
      title={title}
      className={`p-2.5 rounded-lg transition-all duration-200 font-semibold ${disabled
        ? "opacity-40 cursor-not-allowed"
        : active
          ? "bg-cyan-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600 cursor-pointer"
        }`}
    >
      {Icon ? <Icon size={18} /> : children}
    </button>
  );
}

function HeadingButton({ level, command, active }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        command();
      }}
      title={`Heading ${level}`}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${active
        ? "bg-cyan-500 text-white shadow-sm"
        : "text-gray-600 hover:bg-cyan-50 hover:text-cyan-600"
        }`}
    >
      H<sub className="text-xs">{level}</sub>
    </button>
  );
}

/* =========================================================
   MAIN EDITOR COMPONENT
========================================================= */

export default function TipTapEditor({ value, onChange }) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Memoize extensions to prevent duplicate registrations when multiple editors exist
  const extensions = useMemo(() => [
    StarterKit.configure({
      // Explicitly disable extensions that we're adding separately to avoid duplicates
      link: false,
      underline: false, // Disable underline in StarterKit since we add it separately
    }),
    Underline,
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: "max-w-full h-auto rounded-lg",
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      defaultAlignment: "left",
    }),
  ], []);

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (html !== value) {
        onChange(html);
      }
    }
  });
  const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    headingLevel: editor?.isActive("heading")
      ? editor.getAttributes("heading").level
      : null,
  }),
});


  /* 🔒 Sync external value safely */
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === value) return;
    editor.commands.setContent(value || "", false);
  }, [value, editor]);

  /* 🔒 HARD STOP: editor not ready */
  if (!editor) {
    return (
      <div className="border rounded-xl bg-white p-6 text-gray-400">
        Loading editor…
      </div>
    );
  }

  /* =========================
   Handlers
========================================================= */

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await uploadToCloudinary(file);
      const url = result.secure_url; // Use secure_url for backward compatibility
      if (editor && url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    };
    input.click();
  };

  const handleAddLink = () => {
    const url = globalThis.window?.prompt("Enter URL:");
    if (url) {
      if (editor.isActive("link")) {
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      } else {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  };

  
  return (
    <div className="border border-gray-300 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-3 bg-gray-100 text-sm border-b border-gray-300">
        <ToolbarButton
          command={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          Icon={FiBold}
          title="Bold"
        />

        <ToolbarButton
          command={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          Icon={FiItalic}
          title="Italic"
        />

        <ToolbarButton
          command={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          Icon={FiUnderline}
          title="Underline"
        />

        <ToolbarButton
          command={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <span className="text-base" style={{ textDecoration: "line-through" }}>
            S
          </span>
        </ToolbarButton>

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        {[1, 2, 3, 4, 5, 6].map((level) => (
          <HeadingButton
            key={level}
            level={level}
            command={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            // active={editor.isActive("heading", { level })}
            active={editorState.headingLevel === level}

          />
        ))}

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          Icon={BiParagraph}
          title="Paragraph"
        />

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          Icon={FiAlignLeft}
          title="Align Left"
        />

        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          Icon={FiAlignCenter}
          title="Align Center"
        />

        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          Icon={FiAlignRight}
          title="Align Right"
        />

        <ToolbarButton
          command={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          Icon={FiAlignJustify}
          title="Justify"
        />

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          Icon={FiList}
        />

        <ToolbarButton
          command={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <span className="text-sm font-bold">1.</span>
        </ToolbarButton>

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <span className="text-xl">{"\""}</span>
        </ToolbarButton>

        <ToolbarButton
          command={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          Icon={FiCode}
        />

        <ToolbarButton
          command={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <span className="text-sm font-mono">{'`'}</span>
        </ToolbarButton>

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <span className="text-base font-bold">—</span>
        </ToolbarButton>

        <ToolbarButton
          command={() => editor.chain().focus().setHardBreak().run()}
        >
          <span className="text-base">↵</span>
        </ToolbarButton>

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() => editor.chain().focus().undo().run()}
          Icon={FiRotateCcw}
        />

        <ToolbarButton
          command={() => editor.chain().focus().redo().run()}
          Icon={FiRotateCw}
        />

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          Icon={FiType}
          title="Clear formatting"
        />

        <div className="mx-1 border-r border-gray-300 h-6"></div>

        <ToolbarButton
          command={handleAddImage}
          disabled={isUploadingImage}
          Icon={FiImage}
          title={isUploadingImage ? "Uploading..." : "Insert Image"}
        />

        <ToolbarButton
          command={handleAddLink}
          active={editor.isActive("link")}
          Icon={FiLink}
          title="Insert Link"
        />

        <ToolbarButton
          command={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          title="Remove Link"
        >
          <span className="text-sm">Unlink</span>
        </ToolbarButton>
      </div>

      <EditorContent
        editor={editor}
        className="
    px-5 py-4 min-h-[250px] max-h-[400px] overflow-y-auto text-gray-800

    [&_p]:my-4
    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-6
[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:my-5
[&_h3]:text-xl  [&_h3]:font-semibold [&_h3]:my-4
[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:my-3
[&_h5]:text-base [&_h5]:font-semibold [&_h5]:my-2
[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:my-2

    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4
    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4
    [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic
    [&_img]:my-6 [&_img]:rounded-lg

    [&_[style*='text-align:center']]:text-center
    [&_[style*='text-align:right']]:text-right
    [&_[style*='text-align:justify']]:text-justify
  "
      />
    </div>
  );

}







