/**
 * ListPageFrame - 列表页框架组件
 *
 * 用于数据列表页面（如订单列表、商户列表、库存列表），提供：
 * - 统一页面标题、描述和操作按钮（PageHeader）
 * - 可选的筛选器区域
 * - 表格内容区（支持加载中骨架屏和空状态）
 *
 * @example
 * ```tsx
 * <ListPageFrame
 *   title="订单管理"
 *   description="查看和管理所有订单"
 *   action={<Button>导出</Button>}
 *   filters={<SearchInput />}
 *   emptyState={<EmptyState title="暂无订单" />}
 *   isLoading={isLoading}
 * >
 *   <OrdersTable rows={orders} />
 * </ListPageFrame>
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Skeleton } from '../ui/skeleton';

/**
 * ListPageFrame 属性接口
 * @param title - 页面主标题
 * @param description - 页面描述/副标题
 * @param action - 右侧操作按钮（如「新建」「导出」）
 * @param filters - 筛选器区域（如搜索框、状态下拉框）
 * @param children - 表格内容
 * @param emptyState - 空状态组件（当没有数据时显示）
 * @param isLoading - 是否显示加载骨架屏
 * @param className - 自定义样式类名
 */
export interface ListPageFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

/**
 * FW-LIST - 列表页框架
 * PageHeader + 可选筛选器 + 表格插槽（支持加载骨架屏和空状态）
 */
export function ListPageFrame({
  title,
  description,
  action,
  filters,
  children,
  emptyState,
  isLoading,
  className,
}: ListPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 页面标题区 */}
      <PageHeader title={title} description={description} action={action} />

      {/* 筛选器区域 */}
      {filters ? <div className="flex flex-wrap items-center gap-3">{filters}</div> : null}

      {/* 内容区：加载骨架屏 / 空状态 / 实际内容 */}
      {isLoading ? (
        // 加载骨架屏 - 显示 5 行占位
        <div className="space-y-3 rounded-md ring-1 ring-border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : emptyState ? (
        emptyState
      ) : (
        children
      )}
    </div>
  );
}
