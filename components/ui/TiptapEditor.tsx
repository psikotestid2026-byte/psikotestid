'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="bg-slate-100/80 border-b border-slate-200 p-1.5 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
            editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
            editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
            editor.isActive('orderedList') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Daftar Berurutan (Ordered List ol/li)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
            editor.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
          }`}
          title="Daftar Poin (Bullet List ul/li)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Box */}
      <div className="p-3 text-xs text-slate-800 leading-relaxed tiptap-editor">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
