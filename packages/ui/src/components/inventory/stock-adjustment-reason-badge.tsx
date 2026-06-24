import { Badge } from '../ui/badge';

/** 库存调整原因徽章（中文） */
const reasonLabels: Record<string, string> = {
  DAMAGE: '损耗',
  COUNT_CORRECTION: '盘点校正',
  RETURN: '退货入库',
  OTHER: '其他',
};

export function StockAdjustmentReasonBadge({ reason }: { reason: string }) {
  const label = reasonLabels[reason] ?? reason;
  return <Badge variant="outline">{label}</Badge>;
}
