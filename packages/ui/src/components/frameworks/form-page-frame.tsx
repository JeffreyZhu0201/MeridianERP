/**
 * FormPageFrame - 表单页框架组件
 *
 * 用于创建/编辑表单页面（如新建商户、编辑商品），提供：
 * - 页面标题和描述
 * - Card 包裹的表单内容区
 * - 底部操作按钮（如「保存」「取消」）
 *
 * @example
 * ```tsx
 * <FormPageFrame
 *   title="新建商户"
 *   description="填写商户基本信息"
 *   footer={
 *     <>
 *       <Button variant="outline">取消</Button>
 *       <Button type="submit">保存</Button>
 *     </>
 *   }
 * >
 *   <FormField label="商户名称" name="name" />
 *   <FormField label="联系人" name="contact" />
 * </FormPageFrame>
 * ```
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { PageHeader } from '../page-header';
import { Card, CardContent } from '../ui/card';

/**
 * FormPageFrame 属性接口
 * @param title - 表单页面标题
 * @param description - 表单描述信息
 * @param children - 表单内容（通常为 FormField 组件）
 * @param footer - 底部操作按钮区（如「保存」「取消」）
 * @param className - 自定义样式类名
 */
export interface FormPageFrameProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * FW-FORM - 表单页框架
 * PageHeader + Card 包裹的表单内容 + 底部操作按钮
 */
export function FormPageFrame({
  title,
  description,
  children,
  footer,
  className,
}: FormPageFrameProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
      {footer ? <div className="flex items-center justify-end gap-2">{footer}</div> : null}
    </div>
  );
}
