'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ListPaginationProps {
  basePath: string;
  total: number;
  page: number;
  limit: number;
  summary: string;
  pageParam?: string;
}

export function ListPagination({
  basePath,
  total,
  page,
  limit,
  summary,
  pageParam = 'page',
}: ListPaginationProps) {
  const searchParams = useSearchParams();
  const tc = useTranslations('common');
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(pageParam, String(nextPage));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
      <span>{summary}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium hover:bg-accent dark:border-border/40"
          >
            {tc('previous')}
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center rounded-full border border-border px-3 text-xs opacity-50 dark:border-border/40">
            {tc('previous')}
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-xs font-medium hover:bg-accent dark:border-border/40"
          >
            {tc('next')}
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center rounded-full border border-border px-3 text-xs opacity-50 dark:border-border/40">
            {tc('next')}
          </span>
        )}
      </div>
    </div>
  );
}
