'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import '@uiw/react-md-editor/markdown-editor.css';
import { cn } from '../lib/utils';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 280,
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={cn('rounded-xl ring-1 ring-border', className)} data-color-mode={resolvedTheme === 'dark' ? 'dark' : 'light'}>
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? '')}
        preview="edit"
        height={minHeight}
        textareaProps={{ placeholder }}
        visibleDragbar={false}
      />
    </div>
  );
}
