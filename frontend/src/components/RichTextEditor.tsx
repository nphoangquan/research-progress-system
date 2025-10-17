import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Strikethrough,
  Underline,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  className = ""
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        textAlign: false, // Disable default text align to use our extension
        strike: false, // Disable default strike to use our extension
      }),
      TextStyle,
      Color,
      Underline,
      Strike,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
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

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title,
    disabled = false
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-md hover:bg-gray-200 transition-colors duration-150 ${
        isActive ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'text-gray-600 hover:text-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all duration-200 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {/* Font Size Dropdown */}
        <div className="flex items-center space-x-2 mr-4">
          <select 
            className="text-sm border-none bg-transparent focus:outline-none text-gray-700 font-medium"
            onChange={(e) => {
              const size = e.target.value;
              if (size === '14') {
                editor.chain().focus().setParagraph().run();
              } else if (size === '18') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else if (size === '24') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (size === '32') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              }
            }}
          >
            <option value="14">14</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>
        </div>

        {/* Text Color */}
        <ToolbarButton
          onClick={() => {
            const color = editor.isActive('textStyle', { color: '#000000' }) ? null : '#000000';
            editor.chain().focus().setColor(color || '').run();
          }}
          isActive={editor.isActive('textStyle', { color: '#000000' })}
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <div className="p-4 bg-white rounded-b-lg">
        <EditorContent 
          editor={editor} 
          className="focus:outline-none min-h-[200px] prose prose-sm max-w-none"
        />
      </div>
    </div>
  );
}
