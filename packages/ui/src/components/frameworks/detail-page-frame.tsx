/**
 * DetailPageFrame - 详情页框架组件
 *
 * 用于数据详情页面（如订单详情、商户详情），提供：
 * - 面包屑导航（可返回列表页）
 * - 页面标题、描述、状态徽章和操作按钮
 * - 卡片式内容区块
 *
 * @example
 * ```tsx
 * <DetailPageFrame
 *   title="订单 #123456"
 *   description="下单时间：2024-01-15"
 *   backHref="/orders"
 *   backLabel="返回订单列表"
 *   badges={<OrderStatusBadge status="PAID" />}
 *   actions={<Button>编辑</Button>}
 * >
 *   <OrderInfoCard />
 *   <CustomerCard />
 * </DetailPageFrame>
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Skeleton } from '../ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

/**
 * DetailPageFrame 属性接口
 * @param title - 详情页主标题（如订单号、商户名称）
 * @param description - 详情页描述信息
 * @param backHref - 返回链接（设置后显示面包屑导航）
 * @param backLabel - 返回链接文字（默认 "Back"）
 * @param badges - 状态徽章区域（如订单状态、审核状态）
 * @param actions - 操作按钮区域（如编辑、删除）
 * @param children - 详情内容卡片
 * @param className - 自定义样式类名
 */
export interface DetailPageFrameProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * FW-DETAIL - 详情页框架
 * 面包屑导航 + PageHeader（含徽章/操作按钮）+ 卡片式内容区块
 */
export function DetailPageFrame({
  title,
  description,
  backHref,
  backLabel = 'Back',
  badges,
  actions,
  children,
  className,
}: DetailPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* 面包屑导航 */}
      {backHref ? (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={backHref}>{backLabel}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {/* 页面标题区 */}
      <PageHeader
        title={title}
        description={description}
        action={
          badges || actions ? (
            <div className="flex flex-wrap items-center gap-2">
              {badges}
              {actions}
            </div>
          ) : undefined
        }
      />

      {/* 详情内容区块 */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
