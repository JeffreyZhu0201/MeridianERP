'use client';

/**
 * DeliveryShipDialog - 配送发货确认对话框组件
 *
 * 用于确认配送发货操作：
 * - 显示订单信息（订单号、分店、客户、收货地址）
 * - 显示配送商品明细（商品名称、SKU、数量）
 * - 显示库存警告（如库存不足）
 * - 确认后调用 onConfirm 回调
 *
 * 注意：此操作会减少工厂库存且不可逆！
 *
 * @example
 * ```tsx
 * <DeliveryShipDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   orderId="order_abc123"
 *   branchName="星巴克 - 中关村店"
 *   customerLabel="张三"
 *   addressSummary="北京市海淀区中关村大街1号"
 *   lines={[
 *     { productName: '拿铁', quantity: 2, skuCode: 'LATTE-001' },
 *     { productName: '美式', quantity: 1, skuCode: 'AM-001' },
 *   ]}
 *   onConfirm={() => handleShip()}
 *   isSubmitting={isShipping}
 *   stockWarning={stockWarning}
 * />
 * ```
 */

import * as React from 'react';

import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

/**
 * 配送商品明细
 * @param productName - 商品名称
 * @param quantity - 数量
 * @param skuCode - SKU 编码（可选）
 */
export interface DeliveryShipLine {
  productName: string;
  quantity: number;
  skuCode?: string;
}

/**
 * DeliveryShipDialog 属性接口
 * @param open - 对话框是否打开
 * @param onOpenChange - 对话框开关状态变化回调
 * @param orderId - 订单 ID
 * @param branchName - 分店名称
 * @param customerLabel - 客户名称
 * @param addressSummary - 收货地址摘要
 * @param lines - 配送商品明细
 * @param onConfirm - 确认发货回调
 * @param isSubmitting - 是否正在提交
 * @param stockWarning - 库存警告信息（如库存不足）
 */
export interface DeliveryShipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  branchName: string;
  customerLabel: string;
  addressSummary: string;
  lines: DeliveryShipLine[];
  onConfirm?: () => void;
  isSubmitting?: boolean;
  stockWarning?: string;
}

/**
 * 配送发货确认对话框
 * - ESC 键关闭
 * - 点击遮罩层关闭（提交中除外）
 */
export function DeliveryShipDialog({
  open,
  onOpenChange,
  orderId,
  branchName,
  customerLabel,
  addressSummary,
  lines,
  onConfirm,
  isSubmitting,
  stockWarning,
}: DeliveryShipDialogProps) {
  // ESC 键关闭
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => !isSubmitting && onOpenChange(false)}
        aria-hidden
      />

      {/* 对话框内容 */}
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="delivery-ship-title"
        className={cn(
          'relative z-50 grid w-full max-w-lg gap-4 rounded-xl bg-background p-6 ring-1 ring-border',
        )}
      >
        {/* 标题和说明 */}
        <div className="space-y-2">
          <h2 id="delivery-ship-title" className="text-lg font-semibold">
            Mark order shipped
          </h2>
          <p className="text-sm text-muted-foreground">
            Factory inventory will decrease and the order will move to fulfilled. This action
            cannot be undone.
          </p>
        </div>

        {/* 订单信息和商品明细 */}
        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">Order</dt>
            <dd className="font-mono text-xs">{orderId.slice(0, 12)}…</dd>
            <dt className="text-muted-foreground">Branch</dt>
            <dd>{branchName}</dd>
            <dt className="text-muted-foreground">Customer</dt>
            <dd>{customerLabel}</dd>
            <dt className="text-muted-foreground">Ship to</dt>
            <dd className="text-xs leading-relaxed">{addressSummary}</dd>
          </dl>

          {/* 商品列表 */}
          <div className="rounded-lg ring-1 ring-border">
            <ul className="divide-y divide-border">
              {lines.map((line, i) => (
                <li
                  key={`${line.productName}-${i}`}
                  className="flex items-center justify-between gap-4 px-3 py-2"
                >
                  <span>
                    {line.productName}
                    {line.skuCode ? (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {line.skuCode}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums text-muted-foreground">× {line.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 库存警告 */}
          {stockWarning ? (
            <p className="text-sm text-amber-600 dark:text-amber-500" role="alert">
              {stockWarning}
            </p>
          ) : null}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={() => onConfirm?.()}>
            {isSubmitting ? 'Shipping…' : 'Confirm ship'}
          </Button>
        </div>
      </div>
    </div>
  );
}
