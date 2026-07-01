/**
 * StockAdjustmentReasonBadge - 库存调整原因徽章组件
 *
 * 用于展示库存调整的原因类型（商户端中文显示）：
 * - DAMAGE（损耗）
 * - COUNT_CORRECTION（盘点校正）
 * - RETURN（退货入库）
 * - OTHER（其他）
 *
 * @example
 * ```tsx
 * <StockAdjustmentReasonBadge reason="DAMAGE" />
 * <StockAdjustmentReasonBadge reason="RETURN" />
 * ```
 */

import { Badge } from '../ui/badge';

/** 库存调整原因中文映射 */
const reasonLabels: Record<string, string> = {
  DAMAGE: '损耗',
  COUNT_CORRECTION: '盘点校正',
  RETURN: '退货入库',
  OTHER: '其他',
};

/**
 * 库存调整原因徽章
 * @param reason - 调整原因代码
 */
export function StockAdjustmentReasonBadge({ reason }: { reason: string }) {
  const label = reasonLabels[reason] ?? reason;
  return <Badge variant="outline">{label}</Badge>;
}
