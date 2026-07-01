'use client';

/**
 * 库存水位表组件
 *
 * 功能说明:
 * - 展示商品在各仓库的当前库存数量
 * - 支持按仓库筛选库存数据
 * - 支持搜索商品名称或 SKU
 * - 库存低于阈值时显示低库存警告
 * - 商户所有者可以编辑库存预警阈值
 *
 * 使用场景:
 * - 商户员工查看当前库存情况
 * - 识别低库存商品，及时补货
 * - 设置商品级别的库存预警阈值
 *
 * 组件特性:
 * - 客户端组件，支持实时交互和状态管理
 * - 使用 URL 搜索参数同步筛选状态（可分享链接）
 * - 300ms 防抖搜索，避免频繁 API 调用
 */
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  DialogCloseButton,
  EmptyState,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@meridian/ui';
import type { StockLevelWithDetails, Warehouse } from '@meridian/shared';

import { apiFetch } from '@/lib/api';

/**
 * StockLevelsTable 组件 Props
 *
 * @property initialLevels - 初始加载的库存水位数据（SSR/SSG 传入）
 * @property initialTotal - 初始数据总数（用于分页）
 * @property warehouses - 仓库列表，用于下拉筛选
 * @property token - 用户认证令牌（用于调用更新阈值的 API）
 * @property isOwner - 当前用户是否为店主（决定是否显示编辑阈值按钮）
 * @property defaultThreshold - 默认库存预警阈值（当商品未设置自定义阈值时使用）
 *
 * StockLevelWithDetails 类型包含:
 * - id: 库存记录 ID
 * - quantityOnHand: 当前在库数量
 * - variantId: 商品变体 ID
 * - variant: 商品变体详情（名称、SKU、预警阈值等）
 * - warehouse: 所属仓库信息
 */
interface StockLevelsTableProps {
  /** 初始库存水位数据数组 */
  initialLevels: StockLevelWithDetails[];
  /** 数据总数（用于分页计算） */
  initialTotal: number;
  /** 仓库列表，用于按仓库筛选 */
  warehouses: Warehouse[];
  /** JWT 认证令牌，用于更新阈值的 API 调用 */
  token: string;
  /** 是否为店主角色（决定是否显示编辑阈值入口） */
  isOwner: boolean;
  /** 默认库存预警阈值（当商品未设置自定义阈值时） */
  defaultThreshold: number;
}

/**
 * 库存水位表组件
 *
 * 核心功能:
 * 1. 仓库筛选
 *    - 下拉选择仓库，筛选该仓库的库存数据
 *    - 空值表示查看所有仓库
 *
 * 2. 商品搜索
 *    - 支持按商品名称或 SKU 搜索
 *    - 300ms 防抖，避免每次输入都触发搜索
 *
 * 3. 库存状态显示
 *    - outOfStock: 库存为 0，显示红色警告
 *    - lowStock: 库存 <= 预警阈值，显示黄色警告
 *    - 正常库存不显示任何 Badge
 *
 * 4. 阈值编辑（仅店主）
 *    - 点击编辑按钮打开阈值设置对话框
 *    - 支持使用默认阈值（恢复商品的自定义阈值为空）
 *    - 或设置自定义阈值数值
 *
 * 5. 分页导航
 *    - 当 total > 20 时显示分页按钮
 *    - 支持上一页/下一页切换
 *
 * 状态管理:
 * - 使用 React useState 管理本地状态
 * - 通过 router.push 更新 URL 参数，触发 Next.js 重新渲染
 * - 组件重新挂载时通过 useEffect 同步 initialLevels
 */
export function StockLevelsTable({
  initialLevels,
  initialTotal,
  warehouses,
  token,
  isOwner,
  defaultThreshold,
}: StockLevelsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get('warehouseId') ?? '';
  const q = searchParams.get('q') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  const [levels, setLevels] = useState(initialLevels);
  const [total, setTotal] = useState(initialTotal);
  const [searchInput, setSearchInput] = useState(q);
  const [thresholdDialog, setThresholdDialog] = useState<StockLevelWithDetails | null>(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [useDefault, setUseDefault] = useState(false);
  const [error, setError] = useState('');

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.push(`/inventory/stock?${params.toString()}`);
    },
    [router, searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== q) {
        updateParams({ q: searchInput, page: '1' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, updateParams]);

  useEffect(() => {
    setLevels(initialLevels);
    setTotal(initialTotal);
  }, [initialLevels, initialTotal]);

  function effectiveThreshold(level: StockLevelWithDetails): number {
    return level.variant.reorderThreshold ?? defaultThreshold;
  }

  function isLowStock(level: StockLevelWithDetails): boolean {
    return level.quantityOnHand <= effectiveThreshold(level);
  }

  function openThresholdEdit(level: StockLevelWithDetails) {
    setThresholdDialog(level);
    setUseDefault(level.variant.reorderThreshold === null);
    setThresholdValue(
      level.variant.reorderThreshold !== null
        ? String(level.variant.reorderThreshold)
        : String(defaultThreshold),
    );
    setError('');
  }

  async function saveThreshold() {
    if (!thresholdDialog) return;
    setError('');
    try {
      await apiFetch(
        `/merchant/inventory/variants/${thresholdDialog.variantId}/reorder-threshold`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            reorderThreshold: useDefault ? null : Math.max(0, parseInt(thresholdValue, 10) || 0),
          }),
        },
        token,
      );
      setThresholdDialog(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  }

  const t = useTranslations('merchant.inventory.stock');
  const tCommon = useTranslations('common');
  const tInvCommon = useTranslations('merchant.inventory.common');

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <Label htmlFor="warehouse-filter">{t('warehouse')}</Label>
          <Select
            id="warehouse-filter"
            value={warehouseId}
            onChange={(e) => updateParams({ warehouseId: e.target.value, page: '1' })}
            className="min-h-11"
          >
            <option value="">{tInvCommon('allWarehouses')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="stock-search">{tCommon('search')}</Label>
          <Input
            id="stock-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-h-11"
          />
        </div>
      </div>

      {levels.length === 0 ? (
        <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('sku')}</TableHead>
                <TableHead>{t('warehouse')}</TableHead>
                <TableHead className="text-right">{t('onHand')}</TableHead>
                <TableHead className="text-right">{t('threshold')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                {isOwner ? <TableHead className="w-12" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {levels.map((level) => (
                <TableRow
                  key={level.id}
                  className={level.quantityOnHand === 0 ? 'bg-destructive/5' : undefined}
                >
                  <TableCell>{level.variant.productName}</TableCell>
                  <TableCell>
                    <div>{level.variant.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{level.variant.sku}</div>
                  </TableCell>
                  <TableCell>{level.warehouse.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {level.quantityOnHand}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {effectiveThreshold(level)}
                  </TableCell>
                  <TableCell>
                    {level.quantityOnHand === 0 ? (
                      <Badge variant="destructive">{t('outOfStock')}</Badge>
                    ) : isLowStock(level) ? (
                      <Badge variant="warning">{t('lowStock')}</Badge>
                    ) : null}
                  </TableCell>
                  {isOwner ? (
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="min-h-9"
                        onClick={() => openThresholdEdit(level)}
                        aria-label={t('editThreshold')}
                      >
                        {tCommon('edit')}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        门店可售库存仅统计默认仓库的在库数量。
      </p>

      {total > 20 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tCommon('pageOf', { page, total })}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
            >
              {tCommon('previous')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-9"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
            >
              {tCommon('next')}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={!!thresholdDialog}
        onOpenChange={(open) => !open && setThresholdDialog(null)}
        title={t('editThreshold')}
        footer={
          <>
            <DialogCloseButton onClose={() => setThresholdDialog(null)}>{tCommon('cancel')}</DialogCloseButton>
            <Button onClick={saveThreshold}>{tCommon('save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDefault}
              onChange={(e) => setUseDefault(e.target.checked)}
              className="size-4 rounded border border-border dark:border-border/40"
            />
            {t('useDefaultThreshold')}（{defaultThreshold}）
          </label>
          {!useDefault ? (
            <div className="space-y-2">
              <Label htmlFor="threshold">{t('threshold')}</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                inputMode="numeric"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </Dialog>
    </>
  );
}
