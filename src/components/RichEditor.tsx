import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  ImagePlus,
  Loader2,
  Table as TableIcon,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

async function uploadImage(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("entry-images")
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage
    .from("entry-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("Upload failed");
  return data.signedUrl;
}

export function RichEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    shouldRerenderOnTransaction: true,
    content: value,
    editorProps: { attributes: { class: "prose-atlas px-3 py-2.5" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent text-accent-foreground",
      )}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-md border border-input bg-paper focus-within:border-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
        {editor && (
          <>
            {btn(
              editor.isActive("bold"),
              () => editor.chain().focus().toggleBold().run(),
              <Bold size={15} />,
              "Bold",
            )}
            {btn(
              editor.isActive("italic"),
              () => editor.chain().focus().toggleItalic().run(),
              <Italic size={15} />,
              "Italic",
            )}
            {btn(
              editor.isActive("heading"),
              () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
              <Heading2 size={15} />,
              "Heading",
            )}
            {btn(
              editor.isActive("bulletList"),
              () => editor.chain().focus().toggleBulletList().run(),
              <List size={15} />,
              "Bullets",
            )}
            {btn(
              editor.isActive("orderedList"),
              () => editor.chain().focus().toggleOrderedList().run(),
              <ListOrdered size={15} />,
              "Numbered",
            )}
            {btn(
              false,
              () => fileRef.current?.click(),
              uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />,
              "Add image",
            )}
            {btn(
              false,
              () =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
              <TableIcon size={15} />,
              "Insert table",
            )}
            {editor.isActive("table") && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                {btn(
                  false,
                  () => editor.chain().focus().addRowAfter().run(),
                  <Rows3 size={15} />,
                  "Add row",
                )}
                {btn(
                  false,
                  () => editor.chain().focus().addColumnAfter().run(),
                  <Columns3 size={15} />,
                  "Add column",
                )}
                {btn(
                  false,
                  () => editor.chain().focus().deleteRow().run(),
                  <span className="px-0.5 text-[11px] font-medium">−row</span>,
                  "Delete row",
                )}
                {btn(
                  false,
                  () => editor.chain().focus().deleteColumn().run(),
                  <span className="px-0.5 text-[11px] font-medium">−col</span>,
                  "Delete column",
                )}
                {btn(
                  false,
                  () => editor.chain().focus().deleteTable().run(),
                  <Trash2 size={15} />,
                  "Delete table",
                )}
              </>
            )}
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f || !editor) return;
            setUploading(true);
            try {
              const url = await uploadImage(f);
              editor.chain().focus().setImage({ src: url }).run();
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function RichView({ html }: { html: string }) {
  if (!html) return <p className="text-sm italic text-muted-foreground">—</p>;
  return <div className="prose-atlas text-[15px]" dangerouslySetInnerHTML={{ __html: html }} />;
}
