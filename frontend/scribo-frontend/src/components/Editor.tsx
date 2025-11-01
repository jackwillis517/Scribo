import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export const Editor = ({ content, onChange, placeholder = "Start writing..." }: EditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded bg-card border-gray-500 h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-2 flex items-center gap-1 flex-wrap border-gray-500 bg-neutral-800 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-500 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="hover:bg-orange-500 cursor-pointer"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto min-h-0 editor-scroll">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 focus-within:outline-none bg-neutral-800 h-full"
        />
      </div>
    </div>
  );
};