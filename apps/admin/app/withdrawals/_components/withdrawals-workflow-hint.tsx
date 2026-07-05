import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Alert, AlertDescription } from '@meridian/ui';

interface WithdrawalsWorkflowHintProps {
  pendingCount: number;
  showSettlements: boolean;
  accruedCount?: number;
  accruedTotalFormatted?: string;
}

export async function WithdrawalsWorkflowHint({
  pendingCount,
  showSettlements,
  accruedCount = 0,
  accruedTotalFormatted,
}: WithdrawalsWorkflowHintProps) {
  const t = await getTranslations('admin.withdrawals');

  const showAccrued =
    showSettlements && accruedCount > 0 && accruedTotalFormatted != null;
  const showHint = pendingCount > 0 || showSettlements || showAccrued;

  if (!showHint) return null;

  return (
    <Alert className="border-border bg-muted/30">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="space-y-1">
          <p>{showSettlements ? t('workflowHintMerged') : t('workflowHintApprovalOnly')}</p>
          {showAccrued ? (
            <p className="font-medium text-foreground">
              {t('accruedSummary', {
                count: accruedCount,
                amount: accruedTotalFormatted,
              })}
            </p>
          ) : null}
        </div>
        {showSettlements && showAccrued ? (
          <Link
            href="#settlements"
            className="inline-flex h-8 shrink-0 items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('exportSettlements')}
          </Link>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
