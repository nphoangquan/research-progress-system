import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { useCallback, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Undo, 
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Strikethrough,
  Underline as UnderlineIcon,
  Palette
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: ReactNode;
  title: string;
  disabled?: boolean;
}

// ToolbarButton component - moved outside to avoid recreation
const ToolbarButton = ({ 
  onClick, 
  isActive = false, 
  children, 
  title,
  disabled = false
}: ToolbarButtonProps) => (
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

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Bắt đầu viết...",
  className = ""
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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

  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    if (!showColorPicker) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  if (!editor) {
    return null;
  }

  // Handlers with useCallback
  const handleFontSizeChange = useCallback((size: string) => {
    if (size === '14') {
      editor.chain().focus().setParagraph().run();
    } else if (size === '18') {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    } else if (size === '24') {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (size === '32') {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    }
  }, [editor]);

  const handleColorChange = useCallback((color: string) => {
    editor.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  }, [editor]);

  const handleToggleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run();
  }, [editor]);

  const handleToggleItalic = useCallback(() => {
    editor.chain().focus().toggleItalic().run();
  }, [editor]);

  const handleToggleUnderline = useCallback(() => {
    editor.chain().focus().toggleUnderline().run();
  }, [editor]);

  const handleToggleStrike = useCallback(() => {
    editor.chain().focus().toggleStrike().run();
  }, [editor]);

  const handleAlignLeft = useCallback(() => {
    editor.chain().focus().setTextAlign('left').run();
  }, [editor]);

  const handleAlignCenter = useCallback(() => {
    editor.chain().focus().setTextAlign('center').run();
  }, [editor]);

  const handleAlignRight = useCallback(() => {
    editor.chain().focus().setTextAlign('right').run();
  }, [editor]);

  const handleAlignJustify = useCallback(() => {
    editor.chain().focus().setTextAlign('justify').run();
  }, [editor]);

  const handleToggleBulletList = useCallback(() => {
    editor.chain().focus().toggleBulletList().run();
  }, [editor]);

  const handleToggleOrderedList = useCallback(() => {
    editor.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor.chain().focus().undo().run();
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.chain().focus().redo().run();
  }, [editor]);

  // Common colors
  const commonColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#0066FF',
    '#6600FF', '#FF00FF', '#FF0066'
  ];

  return (
    <div className={`border border-gray-300 rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all duration-200 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        {/* Font Size Dropdown */}
        <div className="flex items-center space-x-2 mr-4">
          <select 
            className="text-sm border-none bg-transparent focus:outline-none text-gray-700 font-medium"
            onChange={(e) => handleFontSizeChange(e.target.value)}
          >
            <option value="14">14</option>
            <option value="18">18</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>
        </div>

        {/* Text Color */}
        <div className="relative" ref={colorPickerRef}>
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            isActive={editor.isActive('textStyle') && editor.getAttributes('textStyle').color}
            title="Màu chữ"
          >
            <Palette className="w-4 h-4" />
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Màu tùy chỉnh</label>
                <input
                  type="color"
                  defaultValue="#000000"
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Màu thường dùng</label>
                <div className="grid grid-cols-6 gap-1">
                  {commonColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="w-full text-xs text-gray-600 hover:text-gray-800 py-1"
              >
                Xóa màu
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={handleToggleBold}
          isActive={editor.isActive('bold')}
          title="Đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={handleToggleItalic}
          isActive={editor.isActive('italic')}
          title="Nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleToggleUnderline}
          isActive={editor.isActive('underline')}
          title="Gạch chân (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleToggleStrike}
          isActive={editor.isActive('strike')}
          title="Gạch ngang"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Text Alignment */}
        <ToolbarButton
          onClick={handleAlignLeft}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Căn trái"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleAlignCenter}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Căn giữa"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleAlignRight}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Căn phải"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleAlignJustify}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Căn đều"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Lists */}
        <ToolbarButton
          onClick={handleToggleBulletList}
          isActive={editor.isActive('bulletList')}
          title="Danh sách dấu đầu dòng"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleToggleOrderedList}
          isActive={editor.isActive('orderedList')}
          title="Danh sách đánh số"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={handleUndo}
          disabled={!editor.can().undo()}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleRedo}
          disabled={!editor.can().redo()}
          title="Làm lại (Ctrl+Y)"
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
