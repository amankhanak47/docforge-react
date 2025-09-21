import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';
import { ImageControls } from './ImageControls';
import { ExportButtons } from './ExportButtons';
import { useState, useCallback, useEffect } from 'react';
import mammoth from 'mammoth';

export const DocumentEditor = () => {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Color,
      TextStyle,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: `
      <h1>Document Title</h1>
      <p>Start writing your document here...</p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[800px] p-8',
      },
    },
  });

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        editor.chain().focus().setImage({ src: url }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor]);

  const handleWordUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          
          // Configure mammoth to handle images
          const result = await mammoth.convertToHtml(
            { arrayBuffer },
            {
              convertImage: mammoth.images.imgElement((image) => {
                return image.read("base64").then((imageBuffer) => {
                  return {
                    src: "data:" + image.contentType + ";base64," + imageBuffer
                  };
                });
              })
            }
          );
          
          editor.chain().focus().setContent(result.value).run();
          
          // Show any warnings from mammoth
          if (result.messages.length > 0) {
            console.log('Mammoth conversion warnings:', result.messages);
          }
        } catch (error) {
          console.error('Error parsing Word document:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [editor]);

  const handleImageClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImage(img);
      const rect = img.getBoundingClientRect();
      setImagePosition({ x: rect.right + 10, y: rect.top });
    } else {
      setSelectedImage(null);
    }
  }, []);

  // Add click listener for images
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom;
      editorElement.addEventListener('click', handleImageClick);
      return () => {
        editorElement.removeEventListener('click', handleImageClick);
      };
    }
  }, [editor, handleImageClick]);

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-editor-background">
      <div className="max-w-full">
        {/* Header */}
        <div className="bg-editor-toolbar border-b border-editor-toolbar-border px-4 py-2">
          <h1 className="text-lg font-semibold text-foreground">Document Editor</h1>
        </div>

        {/* Toolbar */}
        <EditorToolbar editor={editor} onImageUpload={handleImageUpload} onWordUpload={handleWordUpload} />

        {/* Export Buttons */}
        <ExportButtons editor={editor} />

        {/* Document Area */}
        <div className="p-8 flex justify-center">
          <div className="bg-editor-document shadow-lg rounded-lg max-w-4xl w-full min-h-[1000px] relative">
            <EditorContent 
              editor={editor} 
              className="p-8"
            />
            
            {/* Dynamic Image Controls */}
            {selectedImage && (
              <ImageControls
                image={selectedImage}
                position={imagePosition}
                editor={editor}
                onClose={() => setSelectedImage(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};