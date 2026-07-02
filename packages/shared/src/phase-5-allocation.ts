import type { AllocationOrderStatus, ReplenishmentRequestStatus } from './phase-5-distribution.js';

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

export interface CreateMasterSkuRequest {
  skuCode: string;
  name: string;
  quantityOnHand?: number;
  unitCost: number;
  wholesalePrice: number;
  retailPrice: number;
}

export interface AllocationOrderLineInput {
  masterSkuId: string;
  quantity: number;
}

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

export interface ReplenishmentRequestSummary {
  id: string;
  tenantId: string;
  status: ReplenishmentRequestStatus;
  note: string | null;
  lineCount: number;
  createdAt: string;
}

export interface CreateReplenishmentRequest {
  note?: string;
  lines: Array<{ masterSkuId: string; quantity: number }>;
}
