import type { BindType } from './enums.js';
import type { CommissionListResponse, CommissionSummary, PerformanceTrendPoint } from './distributors.js';

/**
 * 经销商门户相关类型定义
 * 供经销商用户登录和操作使用
 */

/**
 * 经销商登录请求
 * @property email - 经销商邮箱（必填）
 * @property password - 登录密码（必填）
 * @property tenantSlug - 当同一邮箱在多个商户下存在时，指定登录的商户域
 */
export interface DistributorLoginRequest {
  email: string;
  password: string;
  /** Scope login when the same email exists under multiple merchants. */
  tenantSlug?: string;
}

/**
 * 经销商登录响应
 * @property accessToken - JWT 访问令牌
 * @property distributor - 经销商基本信息
 */
export interface DistributorLoginResponse {
  accessToken: string;
  distributor: {
    id: string;
    name: string;
    email: string;
    tenantSlug: string;
  };
}

/**
 * 启用经销商门户请求
 * 经销商首次设置登录密码以开通门户访问
 * @property password - 登录密码（必填，需符合复杂度要求）
 */
export interface EnableDistributorPortalRequest {
  password: string;
}

/**
 * 启用经销商门户响应
 * @property id - 经销商ID
 * @property portalEnabled - 是否已启用门户
 * @property email - 关联邮箱
 */
export interface EnableDistributorPortalResponse {
  id: string;
  portalEnabled: boolean;
  email: string | null;
}

/**
 * 经销商仪表盘数据
 * 经销商门户首页核心经营指标
 * @property distributorId - 经销商ID
 * @property distributorName - 经销商名称
 * @property branchCount - 招募的分店（商户）数量
 * @property attributedOrderCount - 归因订单总数
 * @property attributedOrderRevenue - 归因订单总收入
 * @property availableBalance - 可提现余额
 * @property commissionSummary - 佣金汇总数据
 * @property trend - 业绩趋势数据序列
 */
export interface DistributorDashboard {
  distributorId: string;
  distributorName: string;
  branchCount: number;
  attributedOrderCount: number;
  attributedOrderRevenue: string | number;
  availableBalance: string | number;
  commissionSummary: CommissionSummary;
  trend: PerformanceTrendPoint[];
}

/**
 * 经销商绑定关系行
 * 经销商查看自己建立的绑定关系
 * @property id - 绑定记录ID
 * @property bindableType - 被绑定方类型（MERCHANT 或 CUSTOMER）
 * @property bindableId - 被绑定方ID
 * @property boundAt - 绑定时间
 */
export interface DistributorBindingRow {
  id: string;
  bindableType: BindType;
  bindableId: string;
  boundAt: string;
}

/**
 * 经销商绑定关系列表响应
 * @property items - 绑定关系列表
 * @property total - 总记录数
 */
export interface DistributorBindingsResponse {
  items: DistributorBindingRow[];
  total: number;
}

/**
 * 经销佣佣金列表响应类型别名
 * 复用 distributors.ts 中定义的分页响应结构
 */
export type DistributorCommissionListResponse = CommissionListResponse;
