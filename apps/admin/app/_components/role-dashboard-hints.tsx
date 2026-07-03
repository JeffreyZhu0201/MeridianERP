import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { AdminPlatformRole } from '@meridian/shared';
import { BentoTile } from '@meridian/ui/server';

interface RoleDashboardHintsProps {
  role: AdminPlatformRole;
}

export async function RoleDashboardHints({ role }: RoleDashboardHintsProps) {
  const t = await getTranslations('admin.dashboard.roleHints');

  const links: Array<{ href: string; label: string }> = (() => {
    switch (role) {
      case 'FINANCE':
        return [
          { href: '/funds', label: t('finance.funds') },
          { href: '/withdrawals', label: t('finance.withdrawals') },
          { href: '/settlements', label: t('finance.settlements') },
        ];
      case 'FULFILLMENT':
        return [
          { href: '/orders?tab=delivery', label: t('fulfillment.orders') },
          { href: '/allocations', label: t('fulfillment.allocations') },
          { href: '/replenishment', label: t('fulfillment.replenishment') },
        ];
      case 'REVIEWER':
        return [
          { href: '/merchants?status=SUBMITTED', label: t('reviewer.merchants') },
          { href: '/replenishment?status=PENDING', label: t('reviewer.replenishment') },
          { href: '/withdrawals?status=PENDING', label: t('reviewer.withdrawals') },
        ];
      case 'SUPER_ADMIN':
        return [{ href: '/admins', label: t('superAdmin.admins') }];
      default:
        return [];
    }
  })();

  if (links.length === 0) return null;

  return (
    <BentoTile colSpan={4}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="text-lg font-medium">{t('title')}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/60"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </BentoTile>
  );
}
