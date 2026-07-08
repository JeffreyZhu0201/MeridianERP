'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

export interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
