import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback } from "react";
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Quote, Undo, Redo, Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LinkedInEmbed } from "./extensions/LinkedInEmbed";
import { parseLinkedInEmbed } from "@/lib/linkedin-embed";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

async function uploadImage(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "3600" });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}

const RichTextEditor = ({ value, onChange }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image,
      LinkedInEmbed,
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm md:prose-base max-w-none min-h-[300px] focus:outline-none p-4",
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(async (f) => {
          const url = await uploadImage(f);
          if (url) view.dispatch(view.state.tr.replaceSelectionWith(view.state.schema.nodes.image.create({ src: url })));
        });
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(async (f) => {
          const url = await uploadImage(f);
          if (url) {
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.anchor;
            view.dispatch(view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src: url })));
          }
        });
        return true;
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onPickFiles = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      for (const f of files) {
        const url = await uploadImage(f);
        if (url) editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  const btn = (active: boolean) => `h-8 w-8 p-0 ${active ? "bg-muted" : ""}`;

  return (
    <div className="border rounded-lg bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className={btn(editor.isActive("link"))} onClick={() => {
          const url = window.prompt("URL do link:");
          if (url === null) return;
          if (url === "") editor.chain().focus().unsetLink().run();
          else editor.chain().focus().setLink({ href: url }).run();
        }}><LinkIcon size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onPickFiles} title="Inserir imagens (arraste, cole ou selecione)">
          <ImageIcon size={16} />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Inserir post do LinkedIn" onClick={() => {
          const input = window.prompt("Cole a URL do post do LinkedIn ou o código <iframe> do Embed:");
          if (!input) return;
          const src = parseLinkedInEmbed(input);
          if (!src) { toast.error("Não foi possível reconhecer o post do LinkedIn"); return; }
          editor.chain().focus().setLinkedInEmbed(src).run();
        }}>
          <Linkedin size={16} />
        </Button>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().undo().run()}><Undo size={16} /></Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().redo().run()}><Redo size={16} /></Button>
      </div>
      <EditorContent editor={editor} />
      <p className="text-xs text-muted-foreground px-3 py-2 border-t bg-muted/30">
        Dica: arraste imagens direto para o editor ou cole (Ctrl+V) para fazer upload automático.
      </p>
    </div>
  );
};

export default RichTextEditor;
