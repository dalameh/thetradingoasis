'use client';

import React, { useRef, useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

   const handleFileUpload = () => {
    fileInputRef.current?.click();
    setShowImageDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const quill = quillRef.current?.getEditor();
    const range = quill?.getSelection(true);

    if (file && quill && range) {
      const reader = new FileReader();
      reader.onload = () => {
        quill.insertEmbed(range.index, "image", reader.result as string);
        quill.setSelection(range.index + 1);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageURL = () => {
    const url = prompt("Enter image URL:");
    const quill = quillRef.current?.getEditor();
    const range = quill?.getSelection(true);

    if (url && quill && range) {
      quill.insertEmbed(range.index, "image", url);
      quill.setSelection(range.index + 1);
    }

    setShowImageDropdown(false);
  };
  
  // Open dropdown and position relative to the image button
  const handleImage = () => {
    const button = document.querySelector('.ql-image') as HTMLElement;
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      setShowImageDropdown(prev => !prev);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.image-dropdown') === null) {
        setShowImageDropdown(false);
      }
    };
    if (showImageDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageDropdown]);

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImage,
        link: function () {
          const quill = quillRef.current?.getEditor();
          const url = prompt('Enter link URL:');
          if (url) quill?.format('link', url);
          else quill?.format('link', false);
        },
      },
    },
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'color', 'background',
    'list', 'indent', 'align',
    'link', 'image',
  ];

  return (
    <div className="rounded border p-2 relative">
      <h2 className="text-center mt-2 mb-2 font-semibold">Trade Notes</h2>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="overflow-y-auto" style={{ maxHeight: '400px', minHeight: '120px' }}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={`Describe the trade you took today\n\n- What did you see in the market that led to your entry?\n- Explain how you felt before, during, and after the trade?\n- Did any bias or outside influence affect your decision-making.\n- Reflect on whether you followed your plan and risk rules.\n- Note what went well and what you can do better next time.`}
          style={{ minHeight: '250px' }} // <-- add this

        />
      </div>

      {showImageDropdown && (
        <div
          className="image-dropdown absolute bg-white border rounded shadow-md p-2"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left, minWidth: '180px', zIndex: 9999 }}
        >
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
            onClick={handleFileUpload}
          >
            Upload from Computer
          </button>
          <button
            className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded mt-1"
            onClick={handleImageURL}
          >
            Insert from URL
          </button>
        </div>
      )}

      <style jsx global>{`
        .ql-toolbar.ql-snow {
          position: sticky;
          top: 0;
          z-index: 20;
          background: white;
          border-bottom: 1px solid #ddd;
        }
        .ql-container.ql-snow {
          border: none;
        }
      `}</style>
    </div>
  );
}