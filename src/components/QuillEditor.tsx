'use client';

import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function QuillEditor({ value, onChange, placeholder, style }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    // Khởi tạo Quill bản địa
    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
          ['link', 'image'],
          ['clean']
        ],
      },
    });

    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', () => {
      if (isUpdatingRef.current) return;
      const html = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
      onChange(html);
    });
  }, [placeholder]);

  // Cập nhật nội dung editor khi prop thay đổi từ bên ngoài (tránh vòng lặp vô hạn)
  useEffect(() => {
    if (!quillRef.current) return;
    const currentHtml = containerRef.current?.querySelector('.ql-editor')?.innerHTML || '';
    if (value !== currentHtml) {
      isUpdatingRef.current = true;
      const range = quillRef.current.getSelection();
      quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
      if (range) {
        quillRef.current.setSelection(range);
      }
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <div className="bg-white text-gray-900 border border-gray-300 rounded-md overflow-hidden shadow-inner" style={style}>
      <div ref={containerRef} style={{ height: 'calc(100% - 42px)' }} />
    </div>
  );
}
