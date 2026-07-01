import type { LeadStage } from './enums.js';
import type { PerformanceTrendPoint } from './distributors.js';

/**
 * 商户仪表盘相关类型定义
 * 用于商户门户首页数据聚合展示
 */

/**
 * 商户近期线索摘要
 * 显示在商户仪表盘最近的线索记录
 * @property id - 线索ID
 * @property title - 线索标题/描述
 * @property stage - 当前阶段（使用 LeadStage 枚举）
 * @property source - 线索来源（如"官网表单"、"地推"等）
 * @property updatedAt - 最后更新时间
 */
export interface MerchantDashboardLead {
  id: string;
  title: string;
  stage: LeadStage | string;
  source?: string | null;
  updatedAt: string;
}

/**
 * 商户近期活动事件
 * 记录绑定、佣金或订单相关的最近业务事件
 * @property type - 事件类型：
 *   - 'binding.created': 新建绑定关系
 *   - 'commission.accrued': 佣金到账
 *   - 'order.paid': 订单完成支付
 * @property occurredAt - 事件发生时间
 * @property distributorId - 相关经销商ID
 * @property distributorName - 相关经销商名称
 * @property bindType - 绑定类型（binding.created事件时存在）
 * @property orderId - 订单ID（order.paid事件时存在）
 * @property amount - 金额（commission.accrued事件时存在）
 */
export interface MerchantDashboardActivity {
  type: 'binding.created' | 'commission.accrued' | 'order.paid';
  occurredAt: string;
  distributorId: string;
  distributorName: string;
  bindType?: string;
  orderId?: string;
  amount?: string;
}

/**
 * 商户门户首页仪表盘聚合数据
 * 包含商户核心经营指标的汇总统计
 * @see GET /api/v1/merchant/dashboard
 * @property businessName - 商户企业名称
 * @property contactsCount - 联系人总数
 * @property openLeads - 待跟进线索数量（NEW + QUALIFIED阶段）
 * @property activeDistributors - 活跃经销商数量
 * @property recentBindings - 近期新建绑定数（最近30天）
 * @property ordersLast30Days - 近30天订单总数
 * @property revenueLast30Days - 近30天销售收入总额
 * @property commissionAccruedLast30Days - 近30天新增应计佣金
 * @property lowStockCount - 当前低库存预警商品数
 * @property trend - 每日业绩趋势数据点序列
 * @property recentLeads - 最近5条线索记录
 * @property recentActivity - 最近10条业务活动事件
 */
export interface MerchantDashboardStats {
  businessName: string;
  contactsCount: number;
  openLeads: number;
  activeDistributors: number;
  recentBindings: number;
  ordersLast30Days: number;
  revenueLast30Days: string | number;
  commissionAccruedLast30Days: string | number;
  lowStockCount: number;
  trend: PerformanceTrendPoint[];
  recentLeads: MerchantDashboardLead[];
  recentActivity: MerchantDashboardActivity[];
}
