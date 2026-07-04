'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from './ui/button';

export interface ListPaginationProps {
  basePath: string;
  total: number;
  page: number;
  limit: number;
  summary: string;
  pageParam?: string;
}

/**
 * URL-aware list pagination — prev/next using shadcn Button styling.
 */
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
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={hrefFor(page - 1)}>{tc('previous')}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-full" disabled>
            {tc('previous')}
          </Button>
        )}
        {page < totalPages ? (
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href={hrefFor(page + 1)}>{tc('next')}</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="rounded-full" disabled>
            {tc('next')}
          </Button>
        )}
      </div>
    </div>
  );
}
