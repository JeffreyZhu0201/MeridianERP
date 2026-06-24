import { OnboardingStatus } from '@meridian/shared';
import { Badge, type BadgeVariant } from '@meridian/ui';

const statusVariant: Record<string, BadgeVariant> = {
  [OnboardingStatus.DRAFT]: 'secondary',
  [OnboardingStatus.SUBMITTED]: 'outline',
  [OnboardingStatus.UNDER_REVIEW]: 'warning',
  [OnboardingStatus.APPROVED]: 'success',
  [OnboardingStatus.REJECTED]: 'destructive',
};

const statusLabel: Record<string, string> = {
  [OnboardingStatus.DRAFT]: 'Draft',
  [OnboardingStatus.SUBMITTED]: 'Submitted',
  [OnboardingStatus.UNDER_REVIEW]: 'Under Review',
  [OnboardingStatus.APPROVED]: 'Approved',
  [OnboardingStatus.REJECTED]: 'Rejected',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? 'secondary'}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}
