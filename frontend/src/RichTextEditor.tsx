'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Code,
  Table,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange?: (htmlContent: string) => void;
}

const fontSizes = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px',
  '36px',
  '48px',
  '72px',
];
const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Palatino',
  'Garamond',
  'Bookman',
  'Comic Sans MS',
  'Trebuchet MS',
  'Arial Black',
  'Impact',
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fontSize, setFontSize] = useState('11px');
  const [fontFamily, setFontFamily] = useState('Arial');

  // Apply style to selected text
  const applyStyle = (styleProperty: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      // If no text is selected, create a zero-width space and apply style
      const span = document.createElement('span');
      span.style.setProperty(styleProperty, value);
      span.appendChild(document.createTextNode('\u200b')); // Zero-width space
      range.insertNode(span);
      // Move cursor after the span
      range.setStart(span.firstChild!, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Wrap selected text with a span and apply style
      const span = document.createElement('span');
      span.style.setProperty(styleProperty, value);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput();
  };

  // Toggle inline style on selected text
  const toggleStyle = (styleProperty: string, value: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Check if selection already has the style
    let hasStyle = false;
    if (selection.anchorNode) {
      const parentElement = selection.anchorNode.parentElement;
      if (parentElement) {
        hasStyle = parentElement.style.getPropertyValue(styleProperty) === value;
      }
    }

    if (hasStyle) {
      // Remove the style
      document.execCommand('removeFormat', false);
    } else {
      // Apply the style
      applyStyle(styleProperty, value);
    }
    handleInput();
  };

  const handleBold = () => {
    toggleStyle('font-weight', 'bold');
  };

  const handleItalic = () => {
    toggleStyle('font-style', 'italic');
  };

  const handleUnderline = () => {
    toggleStyle('text-decoration', 'underline');
  };

  const handleStrikethrough = () => {
    toggleStyle('text-decoration', 'line-through');
  };

  const handleSuperscript = () => {
    toggleStyle('vertical-align', 'super');
    applyStyle('font-size', 'smaller');
  };

  const handleSubscript = () => {
    toggleStyle('vertical-align', 'sub');
    applyStyle('font-size', 'smaller');
  };

  const handleUndo = () => {
    document.execCommand('undo');
  };

  const handleRedo = () => {
    document.execCommand('redo');
  };

  const handleJustify = (alignment: string) => {
    document.execCommand(alignment);
  };

  const handleInsertOrderedList = () => {
    document.execCommand('insertOrderedList');
  };

  const handleInsertUnorderedList = () => {
    document.execCommand('insertUnorderedList');
  };

  const handleLink = () => {
    const url = prompt('Enter the URL');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        insertNodeAtCursor(img);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertNodeAtCursor = (node: Node) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.insertNode(node);

    // Move cursor after the inserted node
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  };

  const handleHeading = (level: number) => {
    document.execCommand('formatBlock', false, `h${level}`);
  };

  const handleBlockquote = () => {
    document.execCommand('formatBlock', false, 'blockquote');
  };

  const handleCodeBlock = () => {
    document.execCommand('formatBlock', false, 'pre');
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    applyStyle('font-size', size);
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    applyStyle('font-family', family);
  };

  const insertTable = () => {
    const rows = parseInt(prompt('Enter number of rows:', '2') || '2', 10);
    const cols = parseInt(prompt('Enter number of columns:', '2') || '2', 10);
    if (rows > 0 && cols > 0) {
      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.width = '100%';
      for (let i = 0; i < rows; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
          const td = document.createElement('td');
          td.style.border = '1px solid #ddd';
          td.style.padding = '8px';
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }
      insertNodeAtCursor(table);
    }
  };

  const handleInput = () => {
    if (editorRef.current && typeof onChange === 'function') {
      onChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-gray-100">
        <div className="flex flex-wrap items-center p-2 border-b bg-white gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleUndo}>
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRedo}>
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fontFamilies.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="Font size" />
            </SelectTrigger>
            <SelectContent>
              {fontSizes.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleBold}>
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleItalic}>
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleUnderline}>
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleStrikethrough}
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strikethrough</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleJustify('justifyLeft')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleJustify('justifyCenter')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleJustify('justifyRight')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleJustify('justifyFull')}
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Justify</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleInsertUnorderedList}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleInsertOrderedList}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleLink}>
                <LinkIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Link</TooltipContent>
          </Tooltip>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            ref={fileInputRef}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Image</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => handleHeading(1)}>
                <Heading1 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 1</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => handleHeading(2)}>
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => handleHeading(3)}>
                <Heading3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>
          <div className="mx-2 border-l h-6"></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleSubscript}>
                <Subscript className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Subscript</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleSuperscript}>
                <Superscript className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Superscript</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleBlockquote}>
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Blockquote</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleCodeBlock}>
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code Block</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={insertTable}>
                <Table className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insert Table</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex justify-center flex-grow overflow-auto py-4">
          <div className="bg-white shadow-md p-8 w-[816px] min-h-[1056px]">
            <div
              ref={editorRef}
              contentEditable
              className="w-full h-full outline-none"
              onInput={handleInput}
              suppressContentEditableWarning={true}
              spellCheck={true}
            >
              {/* Content is managed via useEffect */}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RichTextEditor;
