import type { AllocationOrderStatus, ReplenishmentRequestStatus } from './phase-5-distribution.js';

/**
 * Phase 5 配额分配相关类型定义
 * 平台总部向商户分配商品配额，以及商户向平台提交补货请求
 */

/**
 * 总部主 SKU 摘要
 * 平台总部定义的主商品规格（各商户共享）
 * @property id - SKU 唯一标识
 * @property skuCode - SKU 编码
 * @property name - SKU 名称
 * @property quantityOnHand - 总部当前手库存数量
 * @property cumulativeShippedQty - 累计已发货数量
 * @property unitCost - 单位成本价
 * @property wholesalePrice - 批发价（商户采购价）
 * @property retailPrice - 零售价（建议售价）
 * @property isActive - 是否上架销售
 */
export interface MasterSkuSummary {
  id: string;
  skuCode: string;
  name: string;
  quantityOnHand: number;
  cumulativeShippedQty: number;
  unitCost: string | number;
  wholesalePrice: string | number;
  retailPrice: string | number;
  isActive: boolean;
}

/**
 * 创建总部 SKU 请求
 * @property skuCode - SKU 编码（必填，唯一）
 * @property name - SKU 名称（必填）
 * @property quantityOnHand - 初始手库存（可选，默认0）
 * @property unitCost - 单位成本价（必填）
 * @property wholesalePrice - 批发价（必填）
 * @property retailPrice - 零售价（必填）
 */
export interface CreateMasterSkuRequest {
  skuCode: string;
  name: string;
  quantityOnHand?: number;
  unitCost: number;
  wholesalePrice: number;
  retailPrice: number;
}

/**
 * 配额分配单商品行输入
 * @property masterSkuId - 总部 SKU ID
 * @property quantity - 分配数量
 */
export interface AllocationOrderLineInput {
  masterSkuId: string;
  quantity: number;
}

/**
 * 配额分配单摘要
 * 平台向商户发起商品配额分配的业务单据
 * @property id - 分配单ID
 * @property tenantId - 目标商户ID
 * @property tenantName - 商户名称
 * @property status - 分配单状态
 * @property issuedAt - 平台发布时间
 * @property confirmedAt - 商户确认时间
 * @property lineCount - 商品明细行数
 * @property totalWholesale - 批发价总金额
 * @property createdAt - 创建时间
 */
export interface AllocationOrderSummary {
  id: string;
  tenantId: string;
  tenantName: string;
  status: AllocationOrderStatus;
  issuedAt: string | null;
  confirmedAt: string | null;
  lineCount: number;
  totalWholesale: string | number;
  createdAt: string;
}

/**
 * 补货请求摘要
 * 商户向平台申请补货的业务单据
 * @property id - 补货请求ID
 * @property tenantId - 申请人商户ID
 * @property status - 请求状态
 * @property note - 补货备注说明
 * @property lineCount - 商品明细行数
 * @property createdAt - 创建时间
 */
export interface ReplenishmentRequestSummary {
  id: string;
  tenantId: string;
  status: ReplenishmentRequestStatus;
  note: string | null;
  lineCount: number;
  createdAt: string;
}

/**
 * 创建补货请求
 * @property note - 补货备注（可选）
 * @property lines - 补货商品明细列表
 */
export interface CreateReplenishmentRequest {
  note?: string;
  lines: Array<{ masterSkuId: string; quantity: number }>;
}
