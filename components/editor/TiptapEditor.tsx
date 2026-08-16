'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
  FileCode,
  Eye,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(content);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setRawHtml(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none p-4 min-h-[220px] focus:outline-none text-slate-800 font-sans leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setRawHtml(content);
    }
  }, [content, editor]);

  const handleRawHtmlChange = (newHtml: string) => {
    setRawHtml(newHtml);
    onChange(newHtml);
    if (editor) {
      editor.commands.setContent(newHtml);
    }
  };

  if (!editor) {
    return (
      <div className="border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
        Memuat Tiptap Editor...
      </div>
    );
  }

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar Header */}
      <div className="bg-slate-100/90 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('bold') ? 'bg-slate-300 font-bold text-indigo-700' : ''
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('italic') ? 'bg-slate-300 italic text-indigo-700' : ''
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('strike') ? 'bg-slate-300 text-indigo-700' : ''
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('heading', { level: 1 }) ? 'bg-slate-300 font-bold text-indigo-700' : ''
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('heading', { level: 2 }) ? 'bg-slate-300 font-bold text-indigo-700' : ''
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('heading', { level: 3 }) ? 'bg-slate-300 font-bold text-indigo-700' : ''
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('bulletList') ? 'bg-slate-300 text-indigo-700' : ''
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('orderedList') ? 'bg-slate-300 text-indigo-700' : ''
          }`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ${
            editor.isActive('blockquote') ? 'bg-slate-300 text-indigo-700' : ''
          }`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-40"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all disabled:opacity-40"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all"
          title="Hapus Format"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>

        <div className="ml-auto flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
              isHtmlMode
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isHtmlMode ? (
              <>
                <Eye className="w-3.5 h-3.5" /> WYSIWYG Mode
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5" /> Source HTML
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isHtmlMode ? (
        <textarea
          value={rawHtml}
          onChange={(e) => handleRawHtmlChange(e.target.value)}
          className="w-full p-4 font-mono text-xs text-slate-900 bg-slate-900 text-emerald-400 min-h-[260px] focus:outline-none leading-relaxed border-none resize-y"
          placeholder="Edit kode HTML di sini..."
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
