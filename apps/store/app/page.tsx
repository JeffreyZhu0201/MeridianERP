/**
 * 商店前端首页
 *
 * 功能说明:
 * - 商店门户的入口页面
 * - 提供商店选择器，让消费者选择要访问的商店
 * - 展示商店选择的介绍和操作引导
 *
 * 使用场景:
 * - 消费者访问商店前端时首先看到的页面
 * - 已登录消费者快速选择目标商店
 *
 * 页面布局:
 * - 居中展示的商店选择器组件（StorePicker）
 * - 使用 BentoDashboardFrame 提供统一的仪表盘样式
 * - 最大宽度限制，内容居中显示
 *
 * 子组件:
 * - StorePicker: 商店选择器组件，负责加载商店列表和选择交互
 *
 * 国际化:
 * - 使用 store i18n 命名空间
 * - home.pickerTitle: 页面标题
 * - home.pickerDescription: 页面描述
 */
import { getTranslations } from 'next-intl/server';
import { BentoDashboardFrame } from '@meridian/ui';

import { StorePicker } from './_components/store-picker';

/**
 * 商店前端首页组件
 *
 * 渲染流程:
 * 1. 获取国际化翻译文本（标题和描述）
 * 2. 渲染仪表盘框架容器
 * 3. 在框架内渲染商店选择器组件
 *
 * 响应式设计:
 * - 容器最大宽度 3xl（48rem）
 * - 左右内边距 px-4
 * - 上下内边距 py-8
 */
export default async function HomePage() {
  const t = await getTranslations('store');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <BentoDashboardFrame
        title={t('home.pickerTitle')}
        description={t('home.pickerDescription')}
        columns={2}
      >
        <StorePicker />
      </BentoDashboardFrame>
    </div>
  );
}
