'use client';

/**
 * OrderListFrame - 订单列表框架组件
 *
 * 用于管理订单列表页面，支持：
 * - All/Pickup/Delivery 标签页筛选
 * - 状态筛选下拉框（已支付、已完成、待处理、已取消）
 * - 搜索框
 * - 自定义筛选器插槽
 * - 可选的商户列/自定义列
 * - 加载骨架屏和空状态
 *
 * @example
 * ```tsx
 * <OrderListFrame
 *   title="订单管理"
 *   rows={orders}
 *   activeTab="all"
 *   onTabChange={(tab) => setActiveTab(tab)}
 *   statusFilter="PAID"
 *   onStatusFilterChange={(v) => setStatusFilter(v)}
 *   renderRowAction={(row) => <Button onClick={() => viewOrder(row)}>查看</Button>}
 *   showMerchantColumn
 *   merchantLabel={(row) => row.merchantName}
 * />
 * ```
 */

import * as React from 'react';

import type { OrderListRow, OrderListTab } from '@meridian/shared';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';

import { FulfillmentTypeBadge, type FulfillmentType } from './fulfillment-type-badge';

/** 导出类型供外部使用 */
export type { OrderListRow, OrderListTab };

/**
 * OrderListFrame 属性接口
 * @param title - 列表标题（可选）
 * @param description - 列表描述（可选）
 * @param headerSlot - 标题区额外插槽（如时间范围选择器）
 * @param activeTab - 当前激活的标签页（all/pickup/delivery）
 * @param onTabChange - 标签页切换回调
 * @param showTabs - 是否显示标签页（默认 true）
 * @param statusFilter - 当前状态筛选值
 * @param onStatusFilterChange - 状态筛选变化回调
 * @param searchPlaceholder - 搜索框占位文字
 * @param filterSlot - 自定义筛选器插槽
 * @param rows - 订单数据数组
 * @param renderRowAction - 自定义行操作渲染函数
 * @param showMerchantColumn - 是否显示商户列
 * @param merchantLabel - 商户名称渲染函数
 * @param showMetaColumn - 是否显示元数据列（如订单编号）
 * @param metaColumnLabel - 元数据列标题
 * @param emptyState - 自定义空状态组件
 * @param isLoading - 是否显示加载状态
 * @param className - 自定义样式类名
 */
export interface OrderListFrameProps {
  title?: string;
  description?: string;
  headerSlot?: React.ReactNode;
  activeTab?: OrderListTab;
  onTabChange?: (tab: OrderListTab) => void;
  showTabs?: boolean;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  rows: OrderListRow[];
  renderRowAction?: (row: OrderListRow) => React.ReactNode;
  showMerchantColumn?: boolean;
  merchantLabel?: (row: OrderListRow) => string;
  showMetaColumn?: boolean;
  metaColumnLabel?: string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

/** 订单状态与徽章样式映射 */
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  PAID: 'default',
  FULFILLED: 'default',
  PENDING_PAYMENT: 'secondary',
  CANCELLED: 'destructive',
};

/** 状态徽章组件 */
function statusBadge(status: string) {
  return (
    <Badge variant={statusVariant[status] ?? 'secondary'}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

export function OrderListFrame({
  title,
  description,
  headerSlot,
  activeTab = 'all',
  onTabChange,
  showTabs = true,
  statusFilter = 'all',
  onStatusFilterChange,
  searchPlaceholder = 'Search orders…',
  filterSlot,
  rows,
  renderRowAction,
  showMerchantColumn = false,
  merchantLabel,
  showMetaColumn = false,
  metaColumnLabel = 'Code',
  emptyState,
  isLoading,
  className,
}: OrderListFrameProps) {
  const filteredRows = React.useMemo(() => {
    if (activeTab === 'pickup') {
      return rows.filter((r) => r.fulfillmentType === 'PICKUP');
    }
    if (activeTab === 'delivery') {
      return rows.filter((r) => r.fulfillmentType === 'DELIVERY');
    }
    return rows;
  }, [activeTab, rows]);

  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title ? (
            <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
          ) : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}

      {headerSlot}

      {showTabs ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => onTabChange?.(v as OrderListTab)}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pickup">Pickup</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder={searchPlaceholder} className="max-w-xs" />
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange?.(e.target.value)}
          className="w-[160px]"
        >
          <option value="all">All statuses</option>
          <option value="PAID">Paid</option>
          <option value="FULFILLED">Fulfilled</option>
          <option value="PENDING_PAYMENT">Pending</option>
        </Select>
        {filterSlot}
      </div>

      {isLoading ? (
        <div className="rounded-xl ring-1 ring-border p-4 text-sm text-muted-foreground">
          Loading orders…
        </div>
      ) : filteredRows.length === 0 ? (
        (emptyState ?? (
          <div className="rounded-xl border border-dashed border-border/40 bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm font-medium">No orders</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Orders matching your filters will appear here.
            </p>
          </div>
        ))
      ) : (
        <div className="rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                {showMerchantColumn ? <TableHead>Branch</TableHead> : null}
                <TableHead>Customer</TableHead>
                {showMetaColumn ? <TableHead>{metaColumnLabel}</TableHead> : null}
                <TableHead>Fulfillment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Date</TableHead>
                {renderRowAction ? (
                  <TableHead className="w-[100px]">Action</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">
                    {row.id.slice(0, 8)}…
                  </TableCell>
                  {showMerchantColumn ? (
                    <TableCell className="text-sm">
                      {merchantLabel?.(row) ?? '—'}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-sm">{row.customerLabel}</TableCell>
                  {showMetaColumn ? (
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.meta ?? '—'}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <FulfillmentTypeBadge type={row.fulfillmentType} />
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {row.total}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.createdAt}
                  </TableCell>
                  {renderRowAction ? (
                    <TableCell>{renderRowAction(row)}</TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
