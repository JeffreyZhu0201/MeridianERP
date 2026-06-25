'use client';

import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { cn } from '@meridian/ui';

type TabKey = 'overview' | 'performance';

interface DistributorTabsProps {
  overview: ReactNode;
  performance: ReactNode;
}

export function DistributorTabs({ overview, performance }: DistributorTabsProps) {
  const t = useTranslations('merchant.distributors.tabs');
  const [active, setActive] = useState<TabKey>('overview');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('overview') },
    { key: 'performance', label: t('performance') },
  ];

  return (
    <div className="space-y-6">
      <div
        className="inline-flex h-9 w-fit items-center rounded-lg bg-muted p-[3px] text-muted-foreground"
        role="tablist"
        aria-label={t('ariaLabel')}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={cn(
              'inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-3 text-sm font-medium transition-all',
              active === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-foreground/60 hover:text-foreground',
            )}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" hidden={active !== 'overview'}>
        {active === 'overview' ? overview : null}
      </div>
      <div role="tabpanel" hidden={active !== 'performance'}>
        {active === 'performance' ? performance : null}
      </div>
    </div>
  );
}
