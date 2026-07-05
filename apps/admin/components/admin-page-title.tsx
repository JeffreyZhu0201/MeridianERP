'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

function resolveNavKey(pathname: string): string | null {
  if (pathname === '/' || pathname === '') return 'dashboard';
  if (pathname.startsWith('/admins')) return 'admins';
  if (pathname.startsWith('/users')) return 'users';
  if (pathname.startsWith('/merchants')) return 'merchants';
  if (pathname.startsWith('/inventory')) return 'inventory';
  if (pathname.startsWith('/distributors')) return 'distributors';
  if (pathname.startsWith('/orders')) return 'orders';
  if (pathname.startsWith('/allocations')) return 'allocations';
  if (pathname.startsWith('/procurement')) return 'procurement';
  if (pathname.startsWith('/replenishment')) return 'procurement';
  if (pathname.startsWith('/withdrawals')) return 'withdrawals';
  if (pathname.startsWith('/funds')) return 'funds';
  if (pathname.startsWith('/settlements')) return 'withdrawals';
  if (pathname.startsWith('/settings')) return 'settings';
  return null;
}

export function AdminPageTitle() {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');
  const tc = useTranslations('common');
  const key = resolveNavKey(pathname);

  if (!key) {
    return <span className="text-sm font-medium text-muted-foreground">{tc('platform')}</span>;
  }

  const label = t(key);

  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-medium">{label}</span>
      <span className="truncate text-xs text-muted-foreground">{tc('platform')}</span>
    </div>
  );
}
