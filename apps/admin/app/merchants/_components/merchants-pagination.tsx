'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MerchantsPaginationProps {
  total: number;
  page: number;
  limit: number;
}

export function MerchantsPagination({ total, page, limit }: MerchantsPaginationProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('admin.merchants');
  const tc = useTranslations('common');
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    return `/merchants?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground">
      <span>{t('pagination', { page, totalPages, total })}</span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
          >
            {tc('previous')}
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center rounded-full border border-input px-3 text-xs opacity-50">
            {tc('previous')}
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
          >
            {tc('next')}
          </Link>
        ) : (
          <span className="inline-flex h-8 cursor-not-allowed items-center rounded-full border border-input px-3 text-xs opacity-50">
            {tc('next')}
          </span>
        )}
      </div>
    </div>
  );
}
