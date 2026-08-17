import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { clsx } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "rounded px-2 py-1 text-sm font-semibold transition-colors",
        active ? "bg-orange text-white" : "text-text-muted hover:bg-surface-sunken hover:text-heading",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, locale }: { editor: Editor; locale: "pt-PT" | "en" }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-[var(--border-on-light)] px-2 py-1.5">
      <ToolbarButton
        active={editor.isActive("bold")}
        label={t(locale, "richText.bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        label={t(locale, "richText.italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        label={t(locale, "richText.underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-[var(--border-on-light)]" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        label={t(locale, "richText.bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •≡
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        label={t(locale, "richText.orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.≡
      </ToolbarButton>
    </div>
  );
}

interface RichTextEditorProps {
  value: string | null;
  onChange: (html: string) => void;
  ariaLabel: string;
  placeholder?: string;
}

/** Minimal rich-text field — Bold/Italic/Underline + ordered/unordered lists
 * only, per features/04. StarterKit is explicitly pared down (no headings,
 * links, code, blockquote, strike, hr) rather than exposing its full default
 * toolset; Underline is added on top since StarterKit doesn't include it. */
export function RichTextEditor({ value, onChange, ariaLabel, placeholder }: RichTextEditorProps) {
  const locale = useBuilderLocale();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
    ],
    content: value ?? "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": ariaLabel,
        class: "prose-cv min-h-[110px] px-3 py-2 text-sm text-body focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value ?? "";
    if (!editor.isFocused && next !== current) {
      editor.commands.setContent(next, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rich-text-editor overflow-hidden rounded-md border border-[var(--border-on-light)] bg-surface-card transition-shadow duration-fast ease-standard focus-within:border-orange focus-within:ring-4 focus-within:ring-orange/15">
      {/* Scoped list styling — deliberately not touching the shared
       * src/styles/global.css, since ProseMirror generates <ul>/<ol> tags
       * this component can't attach Tailwind classes to directly. */}
      <style>{`
        .rich-text-editor .ProseMirror ul { list-style: disc; padding-left: 1.25rem; }
        .rich-text-editor .ProseMirror ol { list-style: decimal; padding-left: 1.25rem; }
        .rich-text-editor .ProseMirror p { margin: 0 0 0.5em; }
        .rich-text-editor .ProseMirror p:last-child { margin-bottom: 0; }
        .rich-text-editor .ProseMirror:focus { outline: none; }
      `}</style>
      <Toolbar editor={editor} locale={locale} />
      <EditorContent editor={editor} />
    </div>
  );
}
