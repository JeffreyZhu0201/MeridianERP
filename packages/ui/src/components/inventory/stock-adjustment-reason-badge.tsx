import { Badge } from '../ui/badge';

const reasonLabels: Record<string, string> = {
  DAMAGE: 'Damage',
  COUNT_CORRECTION: 'Count correction',
  RETURN: 'Return',
  OTHER: 'Other',
};

export function StockAdjustmentReasonBadge({ reason }: { reason: string }) {
  const label = reasonLabels[reason] ?? reason;
  return <Badge variant="outline">{label}</Badge>;
}
