'use client';

import { OnboardingStatus } from '@meridian/shared';
import { useTranslations } from 'next-intl';
import { Badge, type BadgeVariant } from '@meridian/ui';

const statusVariant: Record<string, BadgeVariant> = {
  [OnboardingStatus.DRAFT]: 'secondary',
  [OnboardingStatus.SUBMITTED]: 'outline',
  [OnboardingStatus.UNDER_REVIEW]: 'warning',
  [OnboardingStatus.APPROVED]: 'success',
  [OnboardingStatus.REJECTED]: 'destructive',
};

type OnboardingStatusKey = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

const statusLabelKeys: Record<string, OnboardingStatusKey> = {
  [OnboardingStatus.DRAFT]: 'DRAFT',
  [OnboardingStatus.SUBMITTED]: 'SUBMITTED',
  [OnboardingStatus.UNDER_REVIEW]: 'UNDER_REVIEW',
  [OnboardingStatus.APPROVED]: 'APPROVED',
  [OnboardingStatus.REJECTED]: 'REJECTED',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('admin.merchants.onboardingStatus');
  const labelKey = statusLabelKeys[status];
  const label = labelKey ? t(labelKey) : status;

  return <Badge variant={statusVariant[status] ?? 'secondary'}>{label}</Badge>;
}
