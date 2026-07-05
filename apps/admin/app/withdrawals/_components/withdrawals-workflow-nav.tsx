'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@meridian/ui';

interface WithdrawalsWorkflowNavProps {
  showSettlements: boolean;
}

export function WithdrawalsWorkflowNav({ showSettlements }: WithdrawalsWorkflowNavProps) {
  const t = useTranslations('admin.withdrawals');
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : '';

  const steps: Array<{ id: string; label: string; href: string }> = [];
  if (showSettlements) {
    steps.push({
      id: 'settlements',
      label: t('workflowSteps.settlements'),
      href: `/withdrawals${suffix}#settlements`,
    });
  }
  steps.push({
    id: 'approval',
    label: t('workflowSteps.approval'),
    href: `/withdrawals${suffix}#approval`,
  });

  return (
    <nav
      className="flex flex-wrap items-center gap-2"
      aria-label={t('workflowNavLabel')}
    >
      {steps.map((step, index) => (
        <span key={step.id} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          ) : null}
          <Link
            href={step.href}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'bg-muted/50 text-foreground ring-1 ring-border hover:bg-muted',
            )}
          >
            {showSettlements ? (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold ring-1 ring-border">
                {index + 1}
              </span>
            ) : null}
            {step.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
