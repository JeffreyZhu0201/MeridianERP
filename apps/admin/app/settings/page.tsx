/**
 * 平台设置页面
 *
 * 功能说明:
 * - 展示和修改平台全局设置
 * - 配置平台基本信息（名称、邮箱等）
 * - 管理经销商门户开关
 * - 配置邮件队列开关
 * - 管理 Stripe 支付设置
 *
 * 使用场景:
 * - 平台管理员修改平台配置
 * - 启用/禁用经销商门户功能
 * - 配置支付 webhook URL
 *
 * 数据来源:
 * - 平台设置: /platform/settings API
 * - 使用 admin.settings i18n 命名空间
 *
 * 默认配置:
 * - 平台名称: MeridianERP
 * - Stripe 模式: mock（开发环境）
 * - 经销商门户: 启用
 * - 邮件队列: 启用
 */
import { getTranslations } from 'next-intl/server';
import { FormPageFrame } from '@meridian/ui';
import type { PlatformSettingsDto } from '@meridian/shared';

import { AdminShellWrapper } from '@/components/admin-shell-wrapper';
import { ApiError, apiFetch } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { PlatformSettingsForm, PlatformSettingsPayments } from './_components/platform-settings-form';

/**
 * 默认平台设置（API 不可用时使用）
 *
 * @property id - 设置唯一标识（单例）
 * @property platformName - 平台显示名称
 * @property supportEmail - 支持邮箱
 * @property distributorPortalEnabled - 是否启用经销商门户
 * @property emailQueueEnabled - 是否启用邮件队列
 * @property stripeMode - Stripe 模式（mock/test/live）
 * @property stripeKeyHint - Stripe Key 提示
 * @property webhookUrl - Stripe Webhook URL
 */
const DEFAULT_SETTINGS: PlatformSettingsDto = {
  id: 'singleton',
  platformName: 'MeridianERP',
  supportEmail: null,
  distributorPortalEnabled: true,
  emailQueueEnabled: true,
  updatedAt: new Date(0).toISOString(),
  stripeMode: 'mock',
  stripeKeyHint: null,
  webhookUrl: 'http://localhost:3001/api/v1/store/checkout/webhooks/stripe',
};

/**
 * 平台设置页面主组件
 *
 * 页面布局:
 * - AdminShellWrapper: 管理门户框架
 * - FormPageFrame: 表单页面框架
 * - PlatformSettingsForm: 基本设置表单
 * - PlatformSettingsPayments: 支付设置面板
 *
 * 核心功能:
 * 1. 设置加载
 *    - 调用 /platform/settings API 获取当前设置
 *    - API 404 时使用默认配置并显示错误
 *    - 其他错误显示具体错误消息
 *
 * 2. 设置编辑
 *    - PlatformSettingsForm: 基本信息编辑（名称、邮箱等）
 *    - PlatformSettingsPayments: Stripe 支付配置
 *    - 接收 token 用于保存设置
 *
 * 3. 错误处理
 *    - 404: 使用默认配置，显示加载错误提示
 *    - 其他错误: 显示具体错误消息
 *    - readOnly 标志传递给表单组件
 */
export default async function SettingsPage() {
  const token = await getToken();
  if (!token) return null;

  const t = await getTranslations('admin.settings');

  let settings = DEFAULT_SETTINGS;
  let loadError: string | null = null;

  try {
    settings = await apiFetch<PlatformSettingsDto>('/platform/settings', {}, token);
  } catch (err) {
    loadError =
      err instanceof ApiError && err.status === 404
        ? t('loadError')
        : err instanceof Error
          ? err.message
          : t('loadError');
  }

  return (
    <AdminShellWrapper>
      <div className="space-y-6">
        <FormPageFrame title={t('title')} description={t('description')}>
          {loadError ? (
            <p
              className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {loadError}
            </p>
          ) : null}
          <PlatformSettingsForm settings={settings} token={token} readOnly={!!loadError} />
        </FormPageFrame>
        {!loadError ? <PlatformSettingsPayments settings={settings} /> : null}
      </div>
    </AdminShellWrapper>
  );
}
