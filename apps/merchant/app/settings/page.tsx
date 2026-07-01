/**
 * 商户设置页面
 *
 * 功能说明:
 * - 展示和修改商户设置
 * - 管理商户基本资料
 * - 管理团队成员和权限
 * - 配置通知偏好
 *
 * 使用场景:
 * - 商户管理员修改商户信息
 * - 添加/移除团队成员
 * - 配置通知方式
 *
 * 数据来源:
 * - 商户设置: /merchant/settings API
 * - 团队成员: /merchant/team API
 * - 使用 merchant.settings i18n 命名空间
 *
 * 权限说明:
 * - 只有商户 owner 才能修改某些设置
 * - isOwner 标志由 isMerchantOwner(token) 判断
 */
import { getTranslations } from 'next-intl/server';
import { SettingsPageFrame } from '@meridian/ui';
import type { MerchantSettingsDto, TeamMember } from '@meridian/shared';

import { MerchantShellWrapper } from '@/components/merchant-shell-wrapper';
import { apiFetch } from '@/lib/api';
import { getToken, isMerchantOwner } from '@/lib/auth';

import { SettingsPanels } from './_components/settings-panels';

/**
 * 商户设置页面主组件
 *
 * 页面布局:
 * - MerchantShellWrapper: 商户门户框架（传入 businessName 显示商户名称）
 * - SettingsPageFrame: 设置页面框架
 * - SettingsPanels: 设置面板组件
 *
 * 核心功能:
 * 1. 权限验证
 *    - 调用 isMerchantOwner(token) 判断是否为 owner
 *    - owner 可执行更多操作
 *
 * 2. 数据并行加载
 *    - settings: 商户设置信息
 *    - team: 团队成员列表
 *    - 两个接口并行调用
 *
 * 3. SettingsPanels 子组件
 *    - 渲染多个设置面板
 *    - 接收 settings, team, isOwner, token
 *    - 根据权限显示/隐藏某些操作
 */
export default async function SettingsPage() {
  const t = await getTranslations('merchant.settings');
  const token = await getToken();
  if (!token) return null;

  const isOwner = isMerchantOwner(token);

  const [settings, team] = await Promise.all([
    apiFetch<MerchantSettingsDto>('/merchant/settings', {}, token),
    apiFetch<TeamMember[]>('/merchant/team', {}, token),
  ]);

  return (
    <MerchantShellWrapper businessName={settings.profile.businessName}>
      <SettingsPageFrame title={t('title')} description={t('description')}>
        <SettingsPanels
          settings={settings}
          team={team}
          isOwner={isOwner}
          token={token}
        />
      </SettingsPageFrame>
    </MerchantShellWrapper>
  );
}
