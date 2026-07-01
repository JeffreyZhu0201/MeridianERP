import type { CommissionType, MerchantRole } from './enums.js';

/**
 * 商户配置相关类型定义
 * 涵盖商户资料、团队管理和平台设置
 */

/**
 * 商户档案资料
 * 商户企业基本信息
 * @property businessName - 商户商业名称
 * @property legalName - 法律实体名称（可选）
 * @property contactEmail - 主要联系邮箱
 * @property contactPhone - 联系手机号（可选）
 */
export interface MerchantProfileSettings {
  businessName: string;
  legalName?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
}

/**
 * 租户配置数据传输对象
 * 商户层的通用配置项（平台与商户共用此结构）
 * @property tenantId - 租户ID
 * @property defaultCommissionRate - 默认佣金率
 * @property defaultCommissionType - 默认佣金计算方式
 * @property notifyOnBinding - 绑定事件是否通知
 * @property notifyOnCommission - 佣金到账是否通知
 * @property updatedAt - 最后更新时间
 */
export interface TenantSettingsDto {
  tenantId: string;
  defaultCommissionRate: string | number | null;
  defaultCommissionType: CommissionType | null;
  notifyOnBinding: boolean;
  notifyOnCommission: boolean;
  updatedAt: string;
}

/**
 * 商户配置数据传输对象
 * 在租户配置基础上增加商户特有的字段
 * @property profile - 商户档案信息
 * @property storeUrl - 商店访问 URL
 * @property stripeMode - Stripe 支付模式（mock 或 live）
 */
export interface MerchantSettingsDto extends TenantSettingsDto {
  profile: MerchantProfileSettings;
  storeUrl: string;
  stripeMode: 'mock' | 'live';
}

/**
 * 更新商户配置请求
 * @property businessName - 商户名称（可选）
 * @property contactEmail - 联系邮箱（可选）
 * @property contactPhone - 联系电话（可选）
 * @property defaultCommissionRate - 默认佣金率（可选）
 * @property defaultCommissionType - 默认佣金计算方式（可选）
 * @property notifyOnBinding - 绑定通知开关（可选）
 * @property notifyOnCommission - 佣金通知开关（可选）
 */
export interface UpdateMerchantSettingsRequest {
  businessName?: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultCommissionRate?: number | string | null;
  defaultCommissionType?: CommissionType | null;
  notifyOnBinding?: boolean;
  notifyOnCommission?: boolean;
}

/**
 * 团队成员
 * 商户员工的账户信息
 * @property id - 成员ID
 * @property email - 成员邮箱
 * @property role - 成员角色
 * @property createdAt - 加入时间
 */
export interface TeamMember {
  id: string;
  email: string;
  role: MerchantRole;
  createdAt: string;
}

/**
 * 创建团队成员请求
 * @property email - 成员邮箱（必填）
 * @property password - 登录密码（必填）
 */
export interface CreateTeamMemberRequest {
  email: string;
  password: string;
}

/**
 * 更新团队成员请求
 * @property password - 新密码（必填）
 */
export interface UpdateTeamMemberRequest {
  password: string;
}

/**
 * 平台配置数据传输对象
 * 平台管理员查看平台全局配置
 * @property id - 平台配置ID（固定为平台租户ID）
 * @property platformName - 平台显示名称
 * @property supportEmail - 平台支持邮箱
 * @property distributorPortalEnabled - 是否启用经销商门户
 * @property emailQueueEnabled - 是否启用邮件队列
 * @property updatedAt - 最后更新时间
 * @property stripeMode - Stripe 支付模式
 * @property stripeKeyHint - Stripe 密钥提示信息
 * @property webhookUrl - Stripe Webhook 回调地址
 */
export interface PlatformSettingsDto {
  id: string;
  platformName: string;
  supportEmail: string | null;
  distributorPortalEnabled: boolean;
  emailQueueEnabled: boolean;
  updatedAt: string;
  stripeMode: 'mock' | 'live';
  stripeKeyHint: string | null;
  webhookUrl: string;
}

/**
 * 更新平台配置请求
 * @property platformName - 平台名称（可选）
 * @property supportEmail - 支持邮箱（可选）
 * @property distributorPortalEnabled - 经销商门户开关（可选）
 * @property emailQueueEnabled - 邮件队列开关（可选）
 */
export interface UpdatePlatformSettingsRequest {
  platformName?: string;
  supportEmail?: string;
  distributorPortalEnabled?: boolean;
  emailQueueEnabled?: boolean;
}
